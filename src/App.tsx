import { useEffect, useMemo, useState } from "react";
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  LoadingOverlay,
  Box,
  Badge,
} from "@mantine/core";
import "./App.css";

import { store } from "./lib/store";
import { readDir, BaseDirectory, readTextFile } from "@tauri-apps/api/fs";
import { categorizeImages } from "./utils/categorise-images";
import { invoke } from "@tauri-apps/api/tauri";

import { constructSubDirectories } from "./utils/get-lost-pixel-subdirectories";
import { useNavigate, useSearchParams } from "react-router-dom";
import ImageComparison from "./components/image-comparison/image-comparison";
import type { SpotlightAction } from "@mantine/spotlight";
import { SpotlightProvider } from "@mantine/spotlight";
import { Command } from "@tauri-apps/api/shell";

// const actions: SpotlightAction[] = [
//   {
//     title: "Run Lost Pixel",
//     description: "Execute visual regression testing",
//     onTrigger: () => {},
//   },
//   {
//     title: "Settings",
//     description: "Get full information about current system status",
//     onTrigger: () => console.log("Dashboard"),
//   },
//   {
//     title: "Documentation",
//     description: "Visit documentation to lean more about all features",
//     onTrigger: () => console.log("Documentation"),
//   },
// ];
export type ImageType = "noDiff" | "diff" | "addition" | "deletion";

export type Image = {
  name: string;
  path: string;
  // url: string;
};

export type Meta = {
  name: string;
  isWithinThreshold: boolean;
  pixelDifference: number;
  pixelDifferencePercentage: number;
};

export type TypedImage = Image & {
  type: ImageType;
};

const loadImages = async (folder: string): Promise<Image[]> => {
  const entries = await readDir(folder, {
    dir: BaseDirectory.AppData,
    recursive: true,
  });

  const images: Image[] = entries
    .filter((entry) => entry.name !== "meta.json")
    .map((entry) => ({
      name: entry.name as string,
      path: entry.path,
      url: "", // Since we're not reading the image, we can't create a blob URL. You can adjust this as needed.
    }));

  return images;
};

const loadMeta = async (folder: string) => {
  const entries = await readDir(folder, {
    dir: BaseDirectory.AppData,
    recursive: true,
  });

  // Find the meta.json entry
  const metaEntry = entries.find((entry) => entry.name === "meta.json");

  if (!metaEntry) {
    return null;
  }

  // Assuming you have a readFile function to read file content
  const metaContent = await readTextFile(metaEntry.path);

  // Parse the content as JSON and return it
  return JSON.parse(metaContent);
};

function App() {
  const [lostPixelFolder, setLostPixelFolder] = useState<string | null>(null);
  const [gitStatus, setGitStatus] = useState<string>("");
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [_, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [isLpRunLoading, setIsLpRunLoading] = useState<boolean>(false);
  const [isLpRunSuccess, setIsLpRunSuccess] = useState<boolean>(false);
  const [isLpRunError, setIsLpRunError] = useState<boolean>(false);

  const [baselineImages, setBaselineImages] = useState<Image[]>([]);
  const [currentImages, setCurrentImages] = useState<Image[]>([]);
  const [differenceImages, setDifferenceImages] = useState<Image[]>([]);

  const [meta, setMeta] = useState<Meta[] | null>(null);

  const [searchParams] = useSearchParams();
  const selectedImageName = searchParams.get("image");

  const directories = useMemo(() => {
    return constructSubDirectories(lostPixelFolder as string);
  }, [lostPixelFolder]);

  useEffect(() => {
    const setFolders = async () => {
      const lostPixel = await store.get("lostPixelFolder");
      setLostPixelFolder(lostPixel as string | null);
    };

    setFolders();
  }, [store]);

  useEffect(() => {
    if (lostPixelFolder) {
      invoke<string>("check_git_status", { folderPath: lostPixelFolder })
        .then((status) => {
          setGitStatus(status);
        })
        .catch((error) => {
          console.error("Failed to get Git status:", error);
        });
    }
  }, [lostPixelFolder]);

  const loadAndSetImages = async (directory: string, setImageFn: Function) => {
    if (directory) {
      const images = await loadImages(directory);
      setImageFn(images);
    }
  };

  const loadAndSetMeta = async (directory: string) => {
    if (directory) {
      const meta = await loadMeta(directory);
      if (meta === null) {
        return;
      }

      // convert meta object to array before setting state, set keys as values, add other fields
      const metaArray = Object.keys(meta).map((key) => ({
        name: key,
        ...meta[key],
      }));

      setMeta(metaArray);
    }
  };

  useEffect(() => {
    // Load images initially
    loadAndSetImages(directories.baseline, setBaselineImages);
    loadAndSetImages(directories.difference, setDifferenceImages);
    loadAndSetImages(directories.current, setCurrentImages);

    // Load meta
    loadAndSetMeta(directories.current);

    // Set up polling
    const intervalId = setInterval(() => {
      loadAndSetImages(directories.baseline, setBaselineImages);
      loadAndSetImages(directories.difference, setDifferenceImages);
      loadAndSetImages(directories.current, setCurrentImages);
    }, 3000); // Poll every 60 seconds

    return () => clearInterval(intervalId); // Clear the interval when the component is unmounted
  }, [directories, refreshTrigger]);

  const images = useMemo(() => {
    const categorisedImages = categorizeImages(
      baselineImages,
      currentImages,
      differenceImages
    );
    return categorisedImages;
  }, [
    gitStatus,
    baselineImages,
    currentImages,
    differenceImages,
    refreshTrigger,
  ]);

  const selectedImage = images.find(
    (image) => image.name === selectedImageName
  );

  const actions: SpotlightAction[] = [
    {
      title: "Run Lost Pixel",
      description: "Execute visual regression testing",
      onTrigger: async () => {
        const projectPath = await store.get("projectFolder");

        if (typeof projectPath === "string") {
          setIsLpRunLoading(true);
          const command = new Command("npx", ["lost-pixel", "docker", "meta"], {
            cwd: projectPath,
          });
          const output = await command.execute();
          console.log(output);

          command.on("error", (error) => {
            console.log(error);
          });
          command.on("close", (code) => {
            console.log(code);
          });
          command.on("error", (error) =>
            console.error(`command error: "${error}"`)
          );
          command.stdout.on("data", (line) =>
            console.log(`command stdout: "${line}"`)
          );
          try {
            await command.execute();

            setIsLpRunSuccess(true);
          } catch (error) {
            console.log("321");
            console.error(`Command error: "${error}"`);
            setIsLpRunError(true);
          } finally {
            setRefreshTrigger((prev) => prev + 1);
            setIsLpRunLoading(false);
          }
        } else {
          setIsLpRunError(true);
          setIsLpRunLoading(false);
        }
      },
    },
    {
      title: "Settings",
      description: "Navigate to settings page",
      onTrigger: () => navigate("/settings"),
    },
    {
      title: "Documentation",
      description: "Visit documentation to lean more about all features",
      onTrigger: () => console.log("Documentation"),
    },
  ];

  return (
    <>
      <SpotlightProvider
        actions={actions}
        searchPlaceholder="Search..."
        shortcut="mod + k"
        nothingFoundMessage="Nothing found..."
      >
        <Container size="xl" style={{ display: "flex", height: "95vh" }}>
          <LoadingOverlay visible={isLpRunLoading} />
          <Paper
            style={{ width: "20%", marginRight: 20, padding: 20 }}
            withBorder
          >
            {images.filter((image) => image.type !== "noDiff").length > 0 && (
              <Box mah="300px" style={{ overflow: "scroll" }}>
                <Title
                  style={{
                    position: "sticky",
                    top: 0,
                    background: "white",
                    zIndex: 100,
                  }}
                  order={4}
                >
                  Changed
                </Title>
                {images
                  .filter((image) =>
                    ["addition", "deletion", "diff"].includes(image.type)
                  )
                  .map((image) => (
                    <Group spacing="xs">
                      <Text
                        style={{ cursor: "pointer" }}
                        truncate
                        onClick={() => {
                          setSearchParams({
                            image: image.name,
                          });
                        }}
                        color={
                          image.type === "addition"
                            ? "green"
                            : image.type === "deletion"
                            ? "red"
                            : image.type === "diff"
                            ? "blue"
                            : "gray"
                        }
                        opacity={selectedImageName === image.name ? 1 : 0.5}
                      >
                        {image.name}
                      </Text>
                    </Group>
                  ))}
              </Box>
            )}
            <Box mah="41vh" style={{ overflow: "scroll" }}>
              <Group
                spacing={3}
                style={{
                  position: "sticky",
                  top: 0,
                  background: "white",
                  zIndex: 100,
                }}
              >
                <Title order={4}>Baselines</Title>
                <Badge size="xs">{baselineImages.length}</Badge>
              </Group>
              {baselineImages.map((image) => (
                <Group spacing="xs">
                  <Text
                    style={{ cursor: "pointer" }}
                    truncate
                    onClick={() => {
                      setSearchParams({
                        image: image.name,
                        isBaseline: "1",
                      });
                    }}
                    opacity={selectedImageName === image.name ? 1 : 0.5}
                  >
                    {image.name}
                  </Text>
                </Group>
              ))}
            </Box>
          </Paper>

          <Paper
            style={{ flex: 1, padding: 20, overflow: "scroll" }}
            withBorder
          >
            {selectedImage ? (
              <ImageComparison
                meta={meta}
                selectedImage={selectedImage}
                directories={directories}
                setRefreshTrigger={setRefreshTrigger}
              />
            ) : (
              <Text>Select an image to compare</Text>
            )}
          </Paper>
        </Container>
      </SpotlightProvider>
    </>
  );
}

export default App;

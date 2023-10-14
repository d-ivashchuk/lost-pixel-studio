import { useEffect, useMemo, useState } from "react";
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  LoadingOverlay,
} from "@mantine/core";
import "./App.css";

import { store } from "./lib/store";
import { readDir, BaseDirectory } from "@tauri-apps/api/fs";
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

export type TypedImage = Image & {
  type: ImageType;
};

const loadImages = async (folder: string): Promise<Image[]> => {
  const entries = await readDir(folder, {
    dir: BaseDirectory.AppData,
    recursive: true,
  });

  const images: Image[] = entries.map((entry) => ({
    name: entry.name as string,
    path: entry.path,
    url: "", // Since we're not reading the image, we can't create a blob URL. You can adjust this as needed.
  }));

  return images;
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
  console.log({
    isLpRunSuccess,
    isLpRunError,
  });

  const [baselineImages, setBaselineImages] = useState<Image[]>([]);
  const [currentImages, setCurrentImages] = useState<Image[]>([]);
  const [differenceImages, setDifferenceImages] = useState<Image[]>([]);
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

  useEffect(() => {
    // Load images initially
    loadAndSetImages(directories.baseline, setBaselineImages);
    loadAndSetImages(directories.difference, setDifferenceImages);
    loadAndSetImages(directories.current, setCurrentImages);

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
          const command = new Command("run-lost-pixel", ["lost-pixel"], {
            cwd: projectPath,
          });
          try {
            await command.execute();
            setIsLpRunSuccess(true);
          } catch (error) {
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
        <Container size="xl" style={{ display: "flex" }}>
          <LoadingOverlay visible={isLpRunLoading} />
          <Paper
            style={{ width: "20%", marginRight: 20, padding: 20 }}
            withBorder
          >
            <Title order={4}>Changed</Title>
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
            <Title order={4}>Baselines</Title>
            {baselineImages.map((image) => (
              <Group spacing="xs">
                <Text
                  style={{ cursor: "pointer" }}
                  truncate
                  onClick={() => {
                    setSearchParams({
                      image: image.name,
                      isBaseline: "1",
                      blah: ";ajksf",
                    });
                  }}
                  opacity={selectedImageName === image.name ? 1 : 0.5}
                >
                  {image.name}
                </Text>
              </Group>
            ))}
          </Paper>

          <Paper style={{ flex: 1, padding: 20 }} withBorder>
            {selectedImage ? (
              <ImageComparison
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

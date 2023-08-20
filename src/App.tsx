import { useEffect, useMemo, useState } from "react";
import { Container, Paper, Title, Text, Flex, Group, Box } from "@mantine/core";
import "./App.css";

import { store } from "./lib/store";
import { readDir, BaseDirectory } from "@tauri-apps/api/fs";
import { categorizeImages } from "./utils/categorise-images";
import { invoke } from "@tauri-apps/api/tauri";
import ApproveButton from "./components/approve-button";
// import FolderSelection from "./components/folder-selection";
// import GitStatusButton from "./components/git-status-button";
// import RunLostPixelButton from "./components/lost-pixel-run";
import { constructSubDirectories } from "./utils/get-lost-pixel-subdirectories";
import { useSearchParams } from "react-router-dom";
import ImageComparison from "./components/image-comparison/image-comparison";
import RunLostPixelButton from "./components/lost-pixel-run";

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

  const [baselineImages, setBaselineImages] = useState<Image[]>([]);
  const [currentImages, setCurrentImages] = useState<Image[]>([]);
  const [differenceImages, setDifferenceImages] = useState<Image[]>([]);
  const [searchParams] = useSearchParams();
  const imageName = searchParams.get("image");

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

  return (
    <>
      <Container size="xl" style={{ display: "flex" }}>
        <Paper
          style={{ width: "15%", marginRight: 20, padding: 20 }}
          withBorder
        >
          <Title order={4}>Baselines</Title>
          {images.map((image) => (
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
                    ? "yellow"
                    : "gray"
                }
                opacity={imageName === image.name ? 1 : 0.5}
              >
                {image.name}
              </Text>
              {image.type !== "noDiff" && (
                <ApproveButton
                  imageType={image.type}
                  baselinePath={image.path}
                  currentPath={image.path.replace("baseline", "current")}
                  differencePath={image.path.replace("baseline", "difference")}
                  onApprovalComplete={() =>
                    setRefreshTrigger((prev) => prev + 1)
                  }
                />
              )}
            </Group>
          ))}
        </Paper>

        <Paper style={{ flex: 1, padding: 20 }} withBorder>
          <ImageComparison directories={directories} />
        </Paper>
      </Container>
    </>
  );
}

export default App;

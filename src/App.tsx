import { useEffect, useMemo, useState } from "react";
import { Container, Paper, Title, Text, Flex, Group } from "@mantine/core";
import "./App.css";
import FolderSelection from "./components/folder-selection";

import { store } from "./lib/store";
import { readDir, BaseDirectory } from "@tauri-apps/api/fs";
import GitStatusButton from "./components/git-status-button";
import { categorizeImages } from "./utils/categorise-images";
import { invoke } from "@tauri-apps/api/tauri";
import ApproveButton from "./components/approve-button";

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
  console.time(`Time taken to load images from ${folder}`);
  console.log(`Loading images from ${folder}}`);

  console.time(`Time taken to execute readDir from ${folder}`);
  const entries = await readDir(folder, {
    dir: BaseDirectory.AppData,
    recursive: true,
  });
  console.timeEnd(`Time taken to execute readDir from ${folder}`);

  console.log(`Loaded directory entries from ${folder}}`);

  const images: Image[] = entries.map((entry) => ({
    name: entry.name as string,
    path: entry.path,
    url: "", // Since we're not reading the image, we can't create a blob URL. You can adjust this as needed.
  }));

  console.timeEnd(`Time taken to load images from ${folder}`);
  return images;
};

function App() {
  const [baselineFolder, setBaselineFolder] = useState<string | null>(null);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [lostPixelFolder, setLostPixelFolder] = useState<string | null>(null);
  const [gitStatus, setGitStatus] = useState<string>("");

  const [baselineImages, setBaselineImages] = useState<Image[]>([]);
  const [currentImages, setCurrentImages] = useState<Image[]>([]);

  useEffect(() => {
    const setFolders = async () => {
      const baseline = await store.get("baselineFolder");
      const current = await store.get("currentFolder");
      const lostPixel = await store.get("lostPixelFolder");

      setBaselineFolder(baseline as string | null);
      setCurrentFolder(current as string | null);
      setLostPixelFolder(lostPixel as string | null);
    };

    console.time("Time taken to set folders");
    setFolders();
    console.timeEnd("Time taken to set folders");
  }, []);

  useEffect(() => {
    if (lostPixelFolder) {
      console.time(`Time taken to check git from ${lostPixelFolder}`);
      invoke<string>("check_git_status", { folderPath: lostPixelFolder })
        .then((status) => {
          console.log("Setting git status");
          setGitStatus(status);
          console.log({ gitStatus });
        })
        .catch((error) => {
          console.error("Failed to get Git status:", error);
        });
      console.log({ gitStatus });
      console.timeEnd(`Time taken to check git from ${lostPixelFolder}`);
    }
  }, [lostPixelFolder, baselineImages, currentImages]);

  useEffect(() => {
    const setImages = async () => {
      const baseline = await store.get("baselineFolder");
      setBaselineFolder(baseline as string | null);
      if (baselineFolder) {
        console.log("fetching baseline images");
        const images = await loadImages(baselineFolder);
        setBaselineImages(images);
      }
    };

    setImages();

    const intervalId = setInterval(() => {
      setImages();
    }, 3000); // Poll every 3 second

    return () => clearInterval(intervalId); // Clear the interval when the component is unmounted
  }, [baselineFolder, store]);

  useEffect(() => {
    const setImages = async () => {
      const current = await store.get("currentFolder");
      setCurrentFolder(current as string | null);
      if (currentFolder) {
        console.log("fetching current images");
        const images = await loadImages(currentFolder);
        setCurrentImages(images);
      }
    };

    setImages();

    const intervalId = setInterval(() => {
      invoke<string>("check_git_status", { folderPath: lostPixelFolder })
        .then((status) => {
          setGitStatus(status);
        })
        .catch((error) => {
          console.error("Failed to get Git status:", error);
        });
      setImages();
    }, 3000); // Poll every 3 second

    return () => clearInterval(intervalId); // Clear the interval when the component is unmounted
  }, [currentFolder, store]);

  const images = useMemo(() => {
    const categorisedImages = categorizeImages(
      gitStatus,
      baselineImages,
      currentImages
    );
    return categorisedImages;
  }, [gitStatus, baselineImages, currentImages]);

  return (
    <>
      <Container style={{ display: "flex", height: "80%" }}>
        {/* Sidebar */}
        <Paper
          style={{ width: "25%", marginRight: 20, padding: 20 }}
          withBorder
        >
          <Title order={4}>Baseline Folder</Title>
          {baselineImages.map((image) => (
            <div>{image.name}</div>
          ))}
          <Title order={4}>Current Folder</Title>
          {currentImages.map((image) => (
            <div>{image.name}</div>
          ))}
          <Title order={4}>Baselines</Title>
          {images.map((image) => (
            <Group spacing="sm">
              <Text
                color={
                  image.type === "addition"
                    ? "green"
                    : image.type === "deletion"
                    ? "red"
                    : image.type === "diff"
                    ? "yellow"
                    : "gray"
                }
              >
                {image.name}
              </Text>
              {image.type !== "noDiff" && (
                <ApproveButton
                  imageType={image.type}
                  baselinePath={image.path.replace("current", "baseline")}
                  currentPath={image.path}
                />
              )}
            </Group>
          ))}
        </Paper>
        {/* Main Pane */}
        <Paper style={{ flex: 1, padding: 20 }} withBorder>
          <Text align="center" size="xl">
            Comparisons
          </Text>
          <FolderSelection />
          {lostPixelFolder && (
            <GitStatusButton
              gitStatus={gitStatus}
              setGitStatus={setGitStatus}
              folderPath={lostPixelFolder}
              baselineImages={baselineImages}
              currentImages={currentImages}
            />
          )}
        </Paper>
      </Container>
    </>
  );
}

export default App;

//! This is the old code that I used to load images from a folder. I'm keeping it here for reference.

// const loadImages = async (folder: string): Promise<Image[]> => {
//   console.time(`Time taken to load images from ${folder}`);
//   console.log(`Loading images from ${folder}}`);

//   console.time(`Time taken to execute readDir from ${folder}`);
//   const entries = await readDir(folder, {
//     dir: BaseDirectory.AppData,
//     recursive: true,
//   });
//   console.timeEnd(`Time taken to execute readDir from ${folder}`);

//   console.log(`Loaded directory entries from ${folder}}`);

//   console.time(`Time taken to execute imagePromises from ${folder}`);
//   const imagePromises = entries.map((entry) => readBinaryFile(entry.path));
//   console.timeEnd(`Time taken to execute imagePromises from ${folder}`);

//   console.time(`Time taken to execute imageFiles from ${folder}`);
//   const imageFiles = await Promise.all(imagePromises);
//   console.log({ imageFiles });
//   console.timeEnd(`Time taken to execute imageFiles from ${folder}`);

//   console.time(`Time taken to execute images from ${folder}`);
//   const images: Image[] = imageFiles.map((file, index) => ({
//     // url: URL.createObjectURL(new Blob([file])),
//     name: entries[index].name as string,
//     path: entries[index].path,
//   }));
//   console.timeEnd(`Time taken to execute images from ${folder}`);

//   console.timeEnd(`Time taken to load images from ${folder}`);
//   return images;
// };

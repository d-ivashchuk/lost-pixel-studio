import { useEffect, useState } from "react";
import { Center, Container, Paper, Title, Text } from "@mantine/core";
import "./App.css";
import FolderSelection from "./components/folder-selection";
import ImageDisplay from "./components/image-display";
import { store } from "./lib/store";
import { readDir, BaseDirectory, readBinaryFile } from "@tauri-apps/api/fs";
import GitStatusButton from "./components/git-status-button";
import { categorizeImages } from "./utils/categorise-images";
import { invoke } from "@tauri-apps/api/tauri";

export type ImageType = "noDiff" | "diff" | "addition" | "deletion";

export type Image = {
  name: string;
  path: string;
  url: string;
};

export type TypedImage = Image & {
  type: ImageType;
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

    setFolders();
  }, []);

  useEffect(() => {
    invoke<string>("check_git_status", { lostPixelFolder })
      .then((status) => {
        setGitStatus(status);
      })
      .catch((error) => {
        console.error("Failed to get Git status:", error);
      });
    const loadImages = async (folder: string): Promise<Image[]> => {
      console.log(`Loading images from ${folder}}`);
      const entries = await readDir(folder, {
        dir: BaseDirectory.AppData,
        recursive: true,
      });

      const imagePromises = entries.map((entry) => readBinaryFile(entry.path));

      const imageFiles = await Promise.all(imagePromises);

      const images: Image[] = imageFiles.map((file, index) => ({
        url: URL.createObjectURL(new Blob([file])),
        name: entries[index].name as string,
        path: entries[index].path,
      }));

      return images;
    };

    const setImages = async () => {
      const baseline = await store.get("baselineFolder");
      const current = await store.get("currentFolder");

      setBaselineFolder(baseline as string | null);
      setCurrentFolder(current as string | null);

      if (baselineFolder) {
        const images = await loadImages(baselineFolder);
        setBaselineImages(images);
      }
      if (currentFolder) {
        const images = await loadImages(currentFolder);
        setCurrentImages(images);
      }
    };

    setImages();
  }, [baselineFolder, currentFolder, store]);

  const categorisedImages = categorizeImages(
    gitStatus,
    baselineImages,
    currentImages
  );

  return (
    <>
      <Container style={{ display: "flex", height: "80%" }}>
        {/* Sidebar */}
        <Paper
          style={{ width: "25%", marginRight: 20, padding: 20 }}
          withBorder
        >
          <Title>Baseline</Title>
          {baselineImages.map((image) => (
            <div>{image.name}</div>
          ))}
          <Title>Current</Title>
          {currentImages.map((image) => (
            <div>{image.name}</div>
          ))}
          <Title>Baselines</Title>
          {categorisedImages.map((image) => (
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

      {/* <Center>
        <Title order={1}>Lost Pixel Studio</Title>
      </Center>
      <FolderSelection />

      <ImageDisplay path={baselineFolder} />
      <ImageDisplay path={currentFolder} /> */}
    </>
  );
}

export default App;

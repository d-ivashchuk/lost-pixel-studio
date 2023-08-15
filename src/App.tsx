import { useEffect, useState } from "react";
import { Center, Container, Paper, Title, Text } from "@mantine/core";
import "./App.css";
import FolderSelection from "./components/folder-selection";
import ImageDisplay from "./components/image-display";
import { store } from "./lib/store";
import { readDir, BaseDirectory, readBinaryFile } from "@tauri-apps/api/fs";

type Image = {
  name: string;
  path: string;
  url: string;
};

function App() {
  const [baselineFolder, setBaselineFolder] = useState<string | null>(null);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);

  const [baselineImages, setBaselineImages] = useState<Image[]>([]);
  const [currentImages, setCurrentImages] = useState<Image[]>([]);

  useEffect(() => {
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
  }, [baselineFolder, currentFolder]);

  console.log({ baselineImages, currentImages });

  useEffect(() => {
    // Load previously selected folders from the store
    store
      .get("baselineFolder")
      .then((value) => setBaselineFolder(value as string | null));
    store
      .get("currentFolder")
      .then((value) => setCurrentFolder(value as string | null));
  }, [store]);

  console.log({
    baselineFolder,
    currentFolder,
  });

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
        </Paper>
        {/* Main Pane */}
        <Paper style={{ flex: 1 }} withBorder>
          <Text align="center" size="xl">
            Comparisons
          </Text>
          {/* Add your comparison content here */}
        </Paper>
      </Container>
      <FolderSelection />
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

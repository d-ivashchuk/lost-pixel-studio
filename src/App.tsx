import { useEffect, useState } from "react";
import { Center, Title } from "@mantine/core";
import "./App.css";
import FolderSelection from "./components/folder-selection";
import { Store } from "tauri-plugin-store-api";
import ImageDisplay from "./components/image-display";

function App() {
  const [baselineFolder, setBaselineFolder] = useState<string | null>(null);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const store = new Store(".settings.dat");

  useEffect(() => {
    // Load previously selected folders from the store
    store
      .get("baselineFolder")
      .then((value) => setBaselineFolder(value as string | null));
    store
      .get("currentFolder")
      .then((value) => setCurrentFolder(value as string | null));
  }, [store]);

  console.log(baselineFolder, currentFolder);

  return (
    <div className="container">
      <Center>
        <Title order={1}>Lost Pixel Studio</Title>
      </Center>
      <FolderSelection />

      <ImageDisplay path={baselineFolder} />
      <ImageDisplay path={currentFolder} />
    </div>
  );
}

export default App;

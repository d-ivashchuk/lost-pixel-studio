import { useState, useEffect } from "react";
import { Button } from "@mantine/core";
import { open } from "@tauri-apps/api/dialog";
import { Store } from "tauri-plugin-store-api";

function FolderSelection() {
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

  const selectBaselineFolder = async () => {
    const selected = await open({ directory: true });
    if (typeof selected === "string") {
      setBaselineFolder(selected);
      store.set("baselineFolder", selected);
    }
  };

  const selectCurrentFolder = async () => {
    const selected = await open({ directory: true });
    if (typeof selected === "string") {
      setCurrentFolder(selected);
      store.set("currentFolder", selected);
    }
  };

  return (
    <>
      <Button onClick={selectBaselineFolder}>Select Baseline Folder</Button>
      {baselineFolder && <p>Selected Baseline Folder: {baselineFolder}</p>}
      <Button onClick={selectCurrentFolder}>Select Current Folder</Button>
      {currentFolder && <p>Selected Current Folder: {currentFolder}</p>}
    </>
  );
}

export default FolderSelection;

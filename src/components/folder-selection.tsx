import { useState, useEffect } from "react";
import { Button } from "@mantine/core";
import { open } from "@tauri-apps/api/dialog";

import { store } from "../lib/store";

function FolderSelection() {
  const [baselineFolder, setBaselineFolder] = useState<string | null>(null);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [lostPixelFolder, setLostPixelFolder] = useState<string | null>(null);

  useEffect(() => {
    // Load previously selected folders from the store
    store
      .get("baselineFolder")
      .then((value) => setBaselineFolder(value as string | null));
    store
      .get("currentFolder")
      .then((value) => setCurrentFolder(value as string | null));

    store
      .get("lostPixelFolder")
      .then((value) => setLostPixelFolder(value as string | null));
  }, [store]);

  const selectBaselineFolder = async () => {
    const selected = await open({ directory: true, recursive: true });
    if (typeof selected === "string") {
      setBaselineFolder(selected);
      store.set("baselineFolder", selected);
      await store.save();
    }
  };

  const selectCurrentFolder = async () => {
    const selected = await open({ directory: true, recursive: true });
    if (typeof selected === "string") {
      setCurrentFolder(selected);
      store.set("currentFolder", selected);
      await store.save();
    }
  };

  const selectLostPixelFolder = async () => {
    const selected = await open({ directory: true, recursive: true });
    if (typeof selected === "string") {
      setLostPixelFolder(selected);
      store.set("lostPixelFolder", selected);
      await store.save();
    }
  };

  return (
    <>
      <Button onClick={selectBaselineFolder}>Select Baseline Folder</Button>
      {baselineFolder && <p>Selected Baseline Folder: {baselineFolder}</p>}
      <Button onClick={selectCurrentFolder}>Select Current Folder</Button>
      {currentFolder && <p>Selected Current Folder: {currentFolder}</p>}
      <Button onClick={selectLostPixelFolder}>Lost Pixel Folder</Button>
      {currentFolder && <p>Selected Lost Pixel Folder: {lostPixelFolder}</p>}
    </>
  );
}

export default FolderSelection;

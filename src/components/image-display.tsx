import { useEffect, useState } from "react";
import { readDir, readBinaryFile, BaseDirectory } from "@tauri-apps/api/fs";

type ImageDisplayProps = {
  path: string | null;
};

function ImageDisplay({ path }: ImageDisplayProps) {
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    const loadImages = async (folder: string) => {
      const entries = await readDir(folder, {
        dir: BaseDirectory.AppData,
        recursive: true,
      });
      const imagePromises = entries.map((entry) => readBinaryFile(entry.path));
      const imageFiles = await Promise.all(imagePromises);
      const imageUrls = imageFiles.map((file) =>
        URL.createObjectURL(new Blob([file]))
      );
      setImages(imageUrls);
    };

    if (path) {
      loadImages(path);
    }
  }, [path]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: "16px",
      }}
    >
      {images.map((url, index) => (
        <img
          key={index}
          src={url}
          alt={`image-${index}`}
          style={{ width: "100%" }}
        />
      ))}
    </div>
  );
}

export default ImageDisplay;

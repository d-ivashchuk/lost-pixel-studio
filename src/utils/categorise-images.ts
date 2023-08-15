import { Image, TypedImage } from "../App";

export function categorizeImages(
  gitStatus: string,
  baselineImages: Image[],
  currentImages: Image[]
): TypedImage[] {
  const modified = new Set<string>();

  // Parse gitStatus
  gitStatus.split("\n").forEach((line) => {
    const status = line.slice(0, 2).trim();
    const path = line.slice(3).trim();
    const name = path.split("/").pop()?.replace(/\"/g, "") || "";

    if (status === "M") modified.add(name);
  });

  const baselineNames = new Set(baselineImages.map((img) => img.name));
  const currentNames = new Set(currentImages.map((img) => img.name));

  const result: TypedImage[] = [];

  // Check baseline images
  baselineImages.forEach((image) => {
    if (currentNames.has(image.name)) {
      if (modified.has(image.name)) {
        result.push({ ...image, type: "diff" });
      } else {
        result.push({ ...image, type: "noDiff" });
      }
    } else {
      result.push({ ...image, type: "deletion" });
    }
  });

  // Check current images for additions
  currentImages.forEach((image) => {
    if (!baselineNames.has(image.name)) {
      result.push({ ...image, type: "addition" });
    }
  });

  return result;
}

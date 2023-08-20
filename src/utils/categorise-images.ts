import { Image, TypedImage } from "../App";

export function categorizeImages(
  baselineImages: Image[],
  currentImages: Image[],
  differenceImages: Image[]
): TypedImage[] {
  const baselineNames = new Set(baselineImages.map((img) => img.name));
  const currentNames = new Set(currentImages.map((img) => img.name));
  const differenceNames = new Set(differenceImages.map((img) => img.name));

  const result: TypedImage[] = [];

  // Check baseline images
  baselineImages.forEach((image) => {
    if (currentNames.has(image.name)) {
      if (differenceNames.has(image.name)) {
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

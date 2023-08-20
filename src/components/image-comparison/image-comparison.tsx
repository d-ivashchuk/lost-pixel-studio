import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { readBinaryFile } from "@tauri-apps/api/fs";
import { Group, SegmentedControl } from "@mantine/core";
import ImageCompareSlider from "./image-compare-slider";
import ImageCompareDiff from "./image-compare-difference";
import ImageCompareSideBySide from "./image-compare-side-by-side";
import ApproveButton from "../approve-button";
import { TypedImage } from "../../App";

type DirectoryPaths = {
  baseline: string;
  current: string;
  difference: string;
};

type ImageComparisonProps = {
  directories: DirectoryPaths;
  selectedImage: TypedImage;
  setRefreshTrigger: React.Dispatch<React.SetStateAction<number>>;
};

const ImageComparison: React.FC<ImageComparisonProps> = ({
  directories,
  selectedImage,
  setRefreshTrigger,
}) => {
  const [searchParams] = useSearchParams();
  const [comparisonView, setComparisonView] = useState<
    "slider" | "sideBySide" | "difference"
  >("slider");
  const [baselineImageUrl, setBaselineImageUrl] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [differenceImageUrl, setDifferenceImageUrl] = useState<string | null>(
    null
  );

  const loadImageUrl = async (path: string): Promise<string | null> => {
    try {
      const imageFile = await readBinaryFile(path);
      return URL.createObjectURL(new Blob([imageFile]));
    } catch (error) {
      console.error("Failed to load image:", error);
      return null;
    }
  };

  useEffect(() => {
    const imageName = searchParams.get("image");
    if (imageName) {
      loadImageUrl(`${directories.baseline}/${imageName}`).then(
        setBaselineImageUrl
      );
      loadImageUrl(`${directories.current}/${imageName}`).then(
        setCurrentImageUrl
      );
      loadImageUrl(`${directories.difference}/${imageName}`).then(
        setDifferenceImageUrl
      );
    }
  }, [searchParams, directories]);

  return (
    <>
      <Group mb="sm">
        <SegmentedControl
          size="xs"
          value={comparisonView}
          onChange={(value: "slider" | "difference" | "sideBySide") =>
            setComparisonView(value)
          }
          data={[
            { value: "slider", label: "Slider" },
            { value: "sideBySide", label: "Side by side" },
            { value: "difference", label: "Difference" },
          ]}
        />

        <ApproveButton
          imageType={selectedImage.type}
          baselinePath={
            selectedImage.path.includes("baseline")
              ? selectedImage.path
              : selectedImage.path.replace("current", "baseline")
          }
          currentPath={
            selectedImage.path.includes("current")
              ? selectedImage.path
              : selectedImage.path.replace("baseline", "current")
          }
          differencePath={selectedImage.path
            .replace("current", "difference")
            .replace("baseline", "difference")}
          onApprovalComplete={() =>
            setRefreshTrigger((prev: number) => prev + 1)
          }
        />
      </Group>
      {baselineImageUrl && currentImageUrl && (
        <div>
          {comparisonView === "slider" && (
            <ImageCompareSlider
              beforeImage={baselineImageUrl}
              afterImage={currentImageUrl}
            />
          )}
        </div>
      )}
      {differenceImageUrl && (
        <div>
          {comparisonView === "difference" && (
            <ImageCompareDiff differenceImage={differenceImageUrl} />
          )}
        </div>
      )}
      {baselineImageUrl && currentImageUrl && (
        <div>
          {comparisonView === "sideBySide" && (
            <ImageCompareSideBySide
              beforeImage={baselineImageUrl}
              afterImage={currentImageUrl}
              differenceImage={differenceImageUrl ?? ""}
            />
          )}
        </div>
      )}
      {selectedImage.type === "addition" && currentImageUrl && (
        <img
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
          }}
          src={currentImageUrl}
          alt="Addition"
        />
      )}
      {selectedImage.type === "deletion" && baselineImageUrl && (
        <img
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
          }}
          src={baselineImageUrl}
          alt="Addition"
        />
      )}
    </>
  );
};

export default ImageComparison;

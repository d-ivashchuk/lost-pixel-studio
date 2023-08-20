import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { readBinaryFile } from "@tauri-apps/api/fs";
import { Group, SegmentedControl } from "@mantine/core";
import ImageCompareSlider from "./image-compare-slider";
import ImageCompareDiff from "./image-compare-difference";
import ImageCompareSideBySide from "./image-compare-side-by-side";

type DirectoryPaths = {
  baseline: string;
  current: string;
  difference: string;
};

type ImageComparisonProps = {
  directories: DirectoryPaths;
};

const ImageComparison: React.FC<ImageComparisonProps> = ({ directories }) => {
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
    </>
  );
};

export default ImageComparison;

{
  /* <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
  {baselineImageUrl && (
    <div>
      <Text>Baseline</Text>
      <img
        src={baselineImageUrl}
        alt="Baseline Image"
        style={{
          width: "300px",
          border: "1px solid #ddd",
          borderRadius: "4px",
        }}
      />
    </div>
  )}
  {currentImageUrl && (
    <div>
      <Text>Current</Text>
      <img
        src={currentImageUrl}
        alt="Current Image"
        style={{
          width: "300px",
          border: "1px solid #ddd",
          borderRadius: "4px",
        }}
      />
    </div>
  )}
  {differenceImageUrl && (
    <div>
      <Text>Difference</Text>
      <img
        src={differenceImageUrl}
        alt="Difference Image"
        style={{
          width: "300px",
          border: "1px solid #ddd",
          borderRadius: "4px",
        }}
      />
    </div>
  )}
</div>; */
}

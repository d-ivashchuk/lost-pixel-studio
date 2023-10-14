import { Badge } from "@mantine/core";

export const DifferenceBadge = ({
  pixelDifference,
  pixelDifferencePercentage,
  displayMode,
  setDisplayMode,
}: {
  pixelDifference: number;
  pixelDifferencePercentage: number;
  displayMode: "absolute" | "relative";
  setDisplayMode: React.Dispatch<React.SetStateAction<"absolute" | "relative">>;
}) => {
  const onBadgeToggle = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setDisplayMode(displayMode === "absolute" ? "relative" : "absolute");
  };

  return (
    <Badge onClick={onBadgeToggle} color="red">
      {displayMode === "absolute"
        ? `${pixelDifference.toLocaleString()}px`
        : `${Math.round((pixelDifferencePercentage ?? 0) * 10000) / 100}%`}
    </Badge>
  );
};

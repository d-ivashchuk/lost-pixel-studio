import { Button } from "@mantine/core";
import { removeFile, copyFile } from "@tauri-apps/api/fs";

function ApproveButton({
  imageType,
  baselinePath,
  currentPath,
}: {
  imageType: "deletion" | "addition" | "diff";
  baselinePath: string;
  currentPath: string;
}) {
  console.log({ baselinePath, currentPath });
  const handleAction = async () => {
    switch (imageType) {
      case "deletion":
        await removeFile(baselinePath);
        break;
      case "addition":
      case "diff":
        await copyFile(currentPath, baselinePath);
        break;
      default:
        console.error("Unknown image type");
    }
  };

  return (
    <Button variant="outline" size="xs" onClick={handleAction}>
      {imageType === "deletion" ? "Approve Deletion" : "Approve Change"}
    </Button>
  );
}

export default ApproveButton;

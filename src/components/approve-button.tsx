import { Button } from "@mantine/core";
import { removeFile, copyFile } from "@tauri-apps/api/fs";
import { ImageType } from "../App";

function ApproveButton({
  imageType,
  baselinePath,
  currentPath,
  differencePath,
  onApprovalComplete,
}: {
  imageType: ImageType;
  baselinePath: string;
  currentPath: string;
  differencePath?: string; // Optional for diff images
  onApprovalComplete: () => void;
}) {
  const handleAction = async () => {
    console.log({ imageType, baselinePath, currentPath, differencePath });
    switch (imageType) {
      case "deletion":
        await removeFile(baselinePath);
        break;
      case "addition":
        await copyFile(currentPath, baselinePath);
        break;
      case "diff":
        await copyFile(currentPath, baselinePath);
        if (differencePath) {
          await removeFile(differencePath);
        }
        break;
      default:
        console.error("Unknown image type");
    }
    onApprovalComplete();
  };

  return (
    <Button variant="outline" size="xs" onClick={handleAction}>
      {imageType === "deletion" ? "Approve Deletion" : "Approve Change"}
    </Button>
  );
}

export default ApproveButton;

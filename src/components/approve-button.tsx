import { Button } from "@mantine/core";
import { removeFile, copyFile } from "@tauri-apps/api/fs";

function ApproveButton({
  imageType,
  baselinePath,
  currentPath,
  differencePath,
  onApprovalComplete,
}: {
  imageType: "deletion" | "addition" | "diff";
  baselinePath: string;
  currentPath: string;
  differencePath?: string; // Optional for diff images
  onApprovalComplete: () => void;
}) {
  const handleAction = async () => {
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

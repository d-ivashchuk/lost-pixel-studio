export const parseGitStatus = (gitStatusOutput: string) => {
  // Split the output by lines
  const lines = gitStatusOutput.split("\n");

  // Initialize arrays to hold different types of files
  const modifiedImages = [];
  const deletedImages = [];
  const uncommittedImages = [];

  // Loop through each line to categorize files
  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) continue;

    // Extract the status indicator and the file path
    const statusIndicator = line.split(" ")[0];
    const filePath = line.split(" ").slice(1).join(" ").trim();

    // Check if the file is in the .lostpixel folder
    if (filePath.startsWith(".lostpixel/")) {
      // Extract the file name from the file path
      const fileName = filePath.split("/").pop();

      // Check if the file is an image based on its extension
      if (fileName && fileName.match(/\.(jpg|jpeg|png)$/i)) {
        switch (statusIndicator) {
          case "M": // Modified files
            modifiedImages.push(fileName);
            break;
          case "D": // Deleted files
            deletedImages.push(fileName);
            break;
          case "??": // Uncommitted files
            uncommittedImages.push(fileName);
            break;
          default:
            // Handle other types if needed
            break;
        }
      }
    }
  }

  // Return the categorized files
  return {
    modifiedImages,
    deletedImages,
    uncommittedImages,
  };
};

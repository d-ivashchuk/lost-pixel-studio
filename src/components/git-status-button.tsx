// components/GitStatusButton.tsx

import React from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { Button, Text } from "@mantine/core";

import { Image } from "../App";

type GitStatusButtonProps = {
  folderPath: string;
  gitStatus: string;
  setGitStatus: React.Dispatch<React.SetStateAction<string>>;
  baselineImages: Image[];
  currentImages: Image[];
};

const GitStatusButton: React.FC<GitStatusButtonProps> = ({
  folderPath,
  gitStatus,
  setGitStatus,
}) => {
  const handleButtonClick = () => {
    invoke<string>("check_git_status", { folderPath })
      .then((status) => {
        setGitStatus(status);
      })
      .catch((error) => {
        console.error("Failed to get Git status:", error);
      });
  };

  return (
    <div>
      <Button onClick={handleButtonClick}>Check Git Status</Button>
      {gitStatus && (
        <div>
          <Text align="left" size="sm">
            <pre>{gitStatus}</pre>
          </Text>
        </div>
      )}
    </div>
  );
};

export default GitStatusButton;

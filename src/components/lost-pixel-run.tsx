import { Command } from "@tauri-apps/api/shell";
import { useState } from "react";
import { store } from "../lib/store";

function RunLostPixelButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);

  const handleButtonClick = async () => {
    setIsLoading(true);
    setIsSuccess(false);
    setIsError(false);

    const projectPath = await store.get("projectFolder");

    console.log(projectPath);
    if (typeof projectPath === "string") {
      const command = new Command("run-lost-pixel", ["lost-pixel"], {
        cwd: projectPath,
      });
      try {
        await command.execute();
        setIsSuccess(true);
      } catch (error) {
        console.error(`Command error: "${error}"`);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsError(true);
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleButtonClick} disabled={isLoading}>
        Run npx lost-pixel
      </button>
      {isLoading && <span>Loading...</span>}
      {isSuccess && <span>Command ran successfully!</span>}
      {isError && <span>Error running the command.</span>}
    </div>
  );
}

export default RunLostPixelButton;

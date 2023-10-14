// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::process::Command;
use std::env;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn get_current_working_dir() -> Result<String, String> {
    let path_buf = env::current_dir().map_err(|e| e.to_string())?;
    let path_str = path_buf.to_str().ok_or("PathBuf could not be converted to String".to_string())?;
    Ok(path_str.to_string())
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn check_git_status(folder_path: String) -> Result<String, String> {
  Command::new("git")
    .args(["status", "--porcelain"])
    .current_dir(folder_path) // Set the working directory to the provided folder path
    .output()
    .map(|output| String::from_utf8_lossy(&output.stdout).to_string())
    .map_err(|err| err.to_string())
}

#[tauri::command]
fn commit_and_push_lostpixel(folder_path: String) -> Result<String, String> {
  // Navigate to the folder
  if let Err(e) = std::env::set_current_dir(&folder_path) {
    return Err(format!("Failed to set current directory: {}", e));
  }

  // Stage all files in .lostpixel
  if let Err(e) = std::process::Command::new("git")
    .args(&["add", "."])
    .output() {
    return Err(format!("Failed to stage files: {}", e));
  }

  // Commit with the message
  if let Err(e) = std::process::Command::new("git")
    .args(&["commit", "-m", "updating Lost Pixel baselines"])
    .output() {
    return Err(format!("Failed to commit: {}", e));
  }

  // Push to remote
  if let Err(e) = std::process::Command::new("git")
    .args(&["push"])
    .output() {
    return Err(format!("Failed to push: {}", e));
  }

  Ok("Commit and push successful".to_string())
}


fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_persisted_scope::init())
        .invoke_handler(tauri::generate_handler![greet, check_git_status, commit_and_push_lostpixel, get_current_working_dir])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

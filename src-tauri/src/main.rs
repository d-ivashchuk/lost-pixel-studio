// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::process::Command;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
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

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_persisted_scope::init())
        .invoke_handler(tauri::generate_handler![greet, check_git_status])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn list_images(folder_path: String) -> Result<Vec<String>, String> {
  let entries = fs::read_dir(folder_path).map_err(|e| e.to_string())?;
  let image_paths: Vec<String> = entries
    .filter_map(Result::ok)
    .filter(|entry| {
      let path = entry.path();
      path.is_file() && path.extension().map_or(false, |ext| ext == "png" || ext == "jpg" || ext == "jpeg")
    })
    .map(|entry| entry.path().to_str().unwrap().to_string())
    .collect();
  Ok(image_paths)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![greet, list_images])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

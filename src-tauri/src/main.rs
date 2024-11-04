// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;

#[tauri::command]
fn get_aws_credentials() -> (String, String) {
    let access_key = env::var("AWS_ACCESS_KEY_ID")
        .unwrap_or_else(|_| String::from(""));
    let secret_key = env::var("AWS_SECRET_ACCESS_KEY")
        .unwrap_or_else(|_| String::from(""));

    (access_key, secret_key)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_aws_credentials])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

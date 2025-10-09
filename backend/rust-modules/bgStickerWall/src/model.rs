use serde::{Deserialize, Serialize};

#[derive(Deserialize, Debug, Clone)]
pub struct Sticker {
    pub id: String,
    pub file: String, // relative path under ASSET_PATH
    pub x: f32,
    pub y: f32,
    pub width: u32,
    pub height: u32,
    pub rotation: f32, // degrees, positive = CCW
}

#[derive(Deserialize, Debug)]
pub struct ComposeRequest {
    pub background: String, // relative path under ASSET_PATH
    pub stickers: Vec<Sticker>,
    pub output_name: Option<String>,
}

#[derive(Serialize, Debug, Clone, Copy)]
pub struct Corner {
    pub x: f32,
    pub y: f32,
}

#[derive(Serialize, Debug)]
pub struct ClickZone {
    pub id: String,
    pub corners: [Corner; 4],
}

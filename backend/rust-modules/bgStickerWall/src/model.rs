use serde::{Deserialize};
use image::RgbaImage;

#[derive(Debug, Clone, Deserialize)]
pub struct Sticker {
    pub id: String,
    pub file: String,
    pub x: f32,
    pub y: f32,
    pub rotation: f32,
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Clone, Deserialize)]
pub struct InputData {
    pub background: String,
    pub stickers: Vec<Sticker>,
    pub output_name: Option<String>,
}


pub struct Layer {
    pub sticker: Sticker,
    pub rotated: RgbaImage,
    pub draw_x: f32,
    pub draw_y: f32,
    pub opaque_indices: Vec<usize>
}
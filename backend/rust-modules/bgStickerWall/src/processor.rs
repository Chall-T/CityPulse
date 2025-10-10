use crate::model::{InputData, Layer};
use crate::BG_IMAGE;
use anyhow::{Context, Result};
use chrono::Utc;
use image::codecs::webp::WebPEncoder;
use image::imageops;
use image::{Rgba, RgbaImage};
use imageproc::geometric_transformations::{rotate_about_center, Interpolation};

use std::fs::{create_dir_all, File};
use std::io::BufWriter;
use std::path::Path;
use std::time::Duration;
use std::time::UNIX_EPOCH;
use std::time::SystemTime;
use std::time::Instant;
use std::fs;

pub fn compose_bgs(
    asset_root: &str,
    output_dir: &str,
    req: &InputData,
) -> Result<((String, String), (String, String))> {
    use std::sync::Arc;

    // --- Horizontal background ---
    let mut bg_horiz = (*BG_IMAGE).clone();
    let (bg_w_h, bg_h_h) = bg_horiz.dimensions();

    // --- Vertical background ---
    let path_vert = Path::new("../../images/sticker_bg/clean/bg_tiles_vert.webp");
    let mut bg_vert: RgbaImage = image::open(path_vert)?.to_rgba8();
    let (bg_w_v, bg_h_v) = bg_vert.dimensions();

    // --- Helper to process stickers for one background ---
    fn process_layers(
        asset_root: &str,
        req: &InputData,
        bg_w: u32,
        bg_h: u32,
        swap_xy: bool,
    ) -> Result<Vec<Layer>> {
        let layers: Vec<Layer> = req.stickers.iter().map(|sticker| {
            let (sticker_x, sticker_y) = if swap_xy { (sticker.y, sticker.x) } else { (sticker.x, sticker.y) };
            let sticker_path = Path::new(asset_root).join(&sticker.file);
            let img = image::open(&sticker_path).unwrap().to_rgba8();
            let resized = image::imageops::resize(&img, sticker.width, sticker.height, image::imageops::FilterType::Triangle);

            let diag = ((sticker.width.pow(2) + sticker.height.pow(2)) as f32).sqrt().ceil() as u32;
            let mut padded = RgbaImage::from_pixel(diag, diag, image::Rgba([0,0,0,0]));
            let offset_x = (diag as f32 - sticker.width as f32) / 2.0;
            let offset_y = (diag as f32 - sticker.height as f32) / 2.0;
            image::imageops::overlay(&mut padded, &resized, offset_x as i64, offset_y as i64);

            let rotated = rotate_about_center(&padded, sticker.rotation.to_radians(), Interpolation::Bilinear, image::Rgba([0,0,0,0]));

            let draw_x = sticker_x as f32 - offset_x;
            let draw_y = sticker_y as f32 - offset_y;
            let base_x = draw_x as i64;
            let base_y = draw_y as i64;
            let mut opaque_indices = Vec::with_capacity((sticker.width * sticker.height / 2) as usize);

            for y in 0..rotated.height() {
                for x in 0..rotated.width() {
                    let px = base_x + x as i64;
                    let py = base_y + y as i64;
                    if px < 0 || py < 0 || px >= bg_w as i64 || py >= bg_h as i64 { continue; }
                    let idx = (py as u32 * bg_w + px as u32) as usize;
                    if rotated.get_pixel(x, y)[3] > 0 {
                        opaque_indices.push(idx);
                    }
                }
            }

            Layer {
                sticker: sticker.clone(),
                rotated,
                draw_x,
                draw_y,
                opaque_indices,
            }
        }).collect();
        Ok(layers)
    }

    let layers_h = process_layers(asset_root, req, bg_w_h, bg_h_h, false)?;
    let layers_v = process_layers(asset_root, req, bg_w_v, bg_h_v, true)?;

    // --- Function to compute visibility and overlay ---
    fn draw_layers(bg_img: &mut RgbaImage, layers: &[Layer], bg_w: u32, bg_h: u32) -> Result<Vec<serde_json::Value>> {
        let n = layers.len();
        let mut visible = vec![false; n];
        let mut covered = vec![false; (bg_w * bg_h) as usize];

        for i in (0..n).rev() {
            let layer = &layers[i];
            let mut is_visible = false;
            for &idx in &layer.opaque_indices {
                if !covered[idx] { is_visible = true; break; }
            }
            visible[i] = is_visible;
            for &idx in &layer.opaque_indices { covered[idx] = true; }
        }

        let mut visible_stickers = Vec::new();
        for i in 0..n {
            if !visible[i] { continue; }
            let layer = &layers[i];
            image::imageops::overlay(bg_img, &layer.rotated, layer.draw_x as i64, layer.draw_y as i64);

            let rad = layer.sticker.rotation.to_radians();
            let cos = rad.cos();
            let sin = rad.sin();
            let w = layer.sticker.width as f32;
            let h = layer.sticker.height as f32;
            let (x, y) = (layer.sticker.x, layer.sticker.y);
            let corners = vec![
                (x, y),
                (x + w * cos, y + w * sin),
                (x + w * cos - h * sin, y + w * sin + h * cos),
                (x - h * sin, y + h * cos),
            ];
            visible_stickers.push(serde_json::json!({
                "id": layer.sticker.id,
                "corners": corners
            }));
        }
        Ok(visible_stickers)
    }

    // --- Draw horizontal ---
    let visible_stickers_h = draw_layers(&mut bg_horiz, &layers_h, bg_w_h, bg_h_h)?;
    let img_name_h = req.output_name.clone().unwrap_or_else(|| format!("{}_composed_horiz.webp", Utc::now().timestamp()));
    let img_path_h = Path::new(output_dir).join(&img_name_h);
    let mut out_file = BufWriter::new(File::create(&img_path_h)?);
    WebPEncoder::new_lossless(&mut out_file).encode(&bg_horiz, bg_w_h, bg_h_h, image::ColorType::Rgba8.into())?;
    let meta_path_h = Path::new(output_dir).join(format!("{}.meta.json", img_name_h));
    serde_json::to_writer_pretty(File::create(&meta_path_h)?, &serde_json::json!({ "clickable_zones": visible_stickers_h }))?;

    // --- Draw vertical ---
    let visible_stickers_v = draw_layers(&mut bg_vert, &layers_v, bg_w_v, bg_h_v)?;
    let img_name_v = req.output_name.clone().unwrap_or_else(|| format!("{}_composed_vert.webp", Utc::now().timestamp()));
    let img_path_v = Path::new(output_dir).join(&img_name_v);
    let mut out_file = BufWriter::new(File::create(&img_path_v)?);
    WebPEncoder::new_lossless(&mut out_file).encode(&bg_vert, bg_w_v, bg_h_v, image::ColorType::Rgba8.into())?;
    let meta_path_v = Path::new(output_dir).join(format!("{}.meta.json", img_name_v));
    serde_json::to_writer_pretty(File::create(&meta_path_v)?, &serde_json::json!({ "clickable_zones": visible_stickers_v }))?;

    Ok(((img_path_h.to_string_lossy().to_string(), meta_path_h.to_string_lossy().to_string()),
        (img_path_v.to_string_lossy().to_string(), meta_path_v.to_string_lossy().to_string())))
}


pub fn cleanup_old_files_by_name(dir: &str, max_age: Duration) -> std::io::Result<usize> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("Time went backwards")
        .as_secs();

    let mut deleted_count = 0;

    for entry_result in fs::read_dir(dir)? {
        let entry = entry_result?;
        let path = entry.path();

        if !path.is_file() {
            continue;
        }

        if let Some(fname) = path.file_name().and_then(|n| n.to_str()) {
            if let Some(pos) = fname.find('_') {
                if let Ok(ts) = fname[..pos].parse::<u64>() {
                    if now.saturating_sub(ts) > max_age.as_secs() {
                        let _ = fs::remove_file(&path);
                        deleted_count += 1;
                    }
                }
            }
        }
    }

    Ok(deleted_count)
}
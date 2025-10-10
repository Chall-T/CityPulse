use crate::model::{InputData, Layer};
use anyhow::{Context, Result};
use chrono::Utc;
use image::codecs::webp::WebPEncoder;
use image::imageops;
use image::{Rgba, RgbaImage};
use imageproc::geometric_transformations::{rotate_about_center, Interpolation};
use std::fs::{create_dir_all, File};
use std::io::BufWriter;
use std::path::Path;

pub fn compose_image(
    asset_root: &str,
    output_dir: &str,
    req: &InputData,
) -> Result<(String, String)> {
    let json_data = req;

    let bg_path = Path::new(asset_root).join(json_data.background.clone());
    println!("{:?}", bg_path);
    let mut bg_img: RgbaImage = image::open(&bg_path)
        .with_context(|| format!("failed to open background {:?}", bg_path))?
        .to_rgba8();

    let (bg_w, bg_h) = bg_img.dimensions();

    let mut layers: Vec<Layer> = Vec::new();

    for sticker in &req.stickers {
        let sticker_path = Path::new(asset_root).join(&sticker.file);

        let img = image::open(&sticker_path)
    .with_context(|| format!("failed to open sticker {:?}", sticker_path))?
    .to_rgba8();
        let resized = image::imageops::resize(
            &img,
            sticker.width,
            sticker.height,
            image::imageops::FilterType::Lanczos3,
        );

        let diag = ((sticker.width.pow(2) + sticker.height.pow(2)) as f32)
            .sqrt()
            .ceil() as u32;

        let mut padded = RgbaImage::from_pixel(diag, diag, Rgba([0, 0, 0, 0]));
        let offset_x = (diag as f32 - sticker.width as f32) / 2.0;
        let offset_y = (diag as f32 - sticker.height as f32) / 2.0;
        imageops::overlay(&mut padded, &resized, offset_x as i64, offset_y as i64);

        let rotated = rotate_about_center(
            &padded,
            sticker.rotation.to_radians(),
            Interpolation::Bicubic,
            Rgba([0, 0, 0, 0]),
        );

        let draw_x = sticker.x as f32 - offset_x;
        let draw_y = sticker.y as f32 - offset_y;

        let base_x = draw_x as i64;
        let base_y = draw_y as i64;
        let mut opaque_indices = Vec::new();
        for y in 0..rotated.height() {
            for x in 0..rotated.width() {
                let px = base_x + x as i64;
                let py = base_y + y as i64;
                if px < 0 || py < 0 || px >= bg_w as i64 || py >= bg_h as i64 {
                    continue;
                }
                let idx = (py as u32 * bg_w + px as u32) as usize;
                if rotated.get_pixel(x, y)[3] > 0 {
                    opaque_indices.push(idx);
                }
            }
        }

        layers.push(Layer {
            sticker: sticker.clone(),
            rotated,
            draw_x,
            draw_y,
            opaque_indices,
        });
    }

    let n = layers.len();
    let mut visible = vec![false; n];
    let mut covered = vec![false; (bg_w * bg_h) as usize];

    // iterate top -> bottom
    for i in (0..n).rev() {
        let layer = &layers[i];
        let mut is_visible = false;
        for &idx in &layer.opaque_indices {
            if !covered[idx] {
                is_visible = true;
                break;
            }
        }
        visible[i] = is_visible;

        // mark this layer's opaque pixels as covered for lower stickers
        for &idx in &layer.opaque_indices {
            covered[idx] = true;
        }
    }

    // draw only visible stickers in bottom
    let mut visible_stickers = Vec::new();

    for i in 0..n {
        if !visible[i] {
            continue;
        }

        let layer = &layers[i];
        println!(
            "Drawing: {:?} at x: {:.1}, y: {:.1}",
            layer.sticker.file, layer.draw_x, layer.draw_y
        );

        image::imageops::overlay(
            &mut bg_img,
            &layer.rotated,
            layer.draw_x as i64,
            layer.draw_y as i64,
        );

        
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
    create_dir_all(output_dir)
        .with_context(|| format!("failed to create output dir {}", output_dir))?;
    let img_name = req
        .output_name
        .clone()
        .unwrap_or_else(|| format!("composed_{}.webp", Utc::now().timestamp()));
    let img_path = Path::new(output_dir).join(&img_name);
    let mut out_file = BufWriter::new(File::create(&img_path)?);

    let encoder = WebPEncoder::new_lossless(&mut out_file);
    encoder
        .encode(
            &bg_img,
            bg_img.width(),
            bg_img.height(),
            image::ColorType::Rgba8.into(),
        )
        .with_context(|| format!("failed writing webp to {:?}", img_path))?;

    // Save composed image
    let meta_name = format!("{}.meta.json", img_name);
    let meta_path = Path::new(output_dir).join(&meta_name);
    let meta_file = File::create(&meta_path)?;
    serde_json::to_writer_pretty(
        meta_file,
        &serde_json::json!({ "clickable_zones": visible_stickers }),
    )?;

    Ok((
        img_path.to_string_lossy().to_string(),
        meta_path.to_string_lossy().to_string(),
    ))
}

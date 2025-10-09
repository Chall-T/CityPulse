use crate::model::{ClickZone, ComposeRequest, Corner};
use anyhow::{Context, Result};
use chrono::Utc;
use image::codecs::webp::WebPEncoder;
use image::imageops::{self, FilterType};
use image::{ColorType, Rgba, RgbaImage};
use imageproc::geometric_transformations::{rotate_about_center, Interpolation};
use std::fs::{create_dir_all, File};
use std::io::BufWriter;
use std::path::Path;

/// Compose the background with stickers, write a WebP and the metadata JSON.
/// Returns (image_path_str, metadata_path_str).
pub fn compose(
    asset_root: &str,
    output_dir: &str,
    req: &ComposeRequest,
) -> Result<(String, String)> {
    // Resolve background path and open
    let bg_path = Path::new(asset_root).join(&req.background);
    let mut bg: RgbaImage = image::open(&bg_path)
        .with_context(|| format!("failed to open background {:?}", bg_path))?
        .to_rgba8();

    let mut click_zones: Vec<ClickZone> = Vec::new();

    for st in &req.stickers {
        let sticker_path = Path::new(asset_root).join(&st.file);
        let sticker = image::open(&sticker_path)
            .with_context(|| format!("failed to open sticker {:?}", sticker_path))?
            .to_rgba8();

        // Resize sticker to requested size
        let resized: RgbaImage =
            imageops::resize(&sticker, st.width, st.height, FilterType::Lanczos3);

        // Rotate about center (angle in radians)
        let angle_rad: f32 = st.rotation.to_radians();
        let rotated: RgbaImage = rotate_about_center(
            &resized,
            angle_rad,
            Interpolation::Bilinear,
            Rgba([0, 0, 0, 0]),
        );

        // Compute paste position so that the sticker's logical (x,y) (top-left)
        // aligns with the un-rotated top-left of the sticker.
        // We want the rotated image centered at the sticker center (cx,cy)
        let cx = st.x + (st.width as f32) / 2.0;
        let cy = st.y + (st.height as f32) / 2.0;
        let paste_x = (cx - (rotated.width() as f32) / 2.0).round() as i32;
        let paste_y = (cy - (rotated.height() as f32) / 2.0).round() as i32;

        // Overlay rotated image onto background with alpha blending and clipping
        overlay_with_clip(&mut bg, &rotated, paste_x, paste_y);

        // Compute rotated corners in background coordinate space for metadata
        let corners = rotated_corners(st.x, st.y, st.width as f32, st.height as f32, st.rotation);
        click_zones.push(ClickZone {
            id: st.id.clone(),
            corners,
        });
    }

    // Ensure output dir exists
    create_dir_all(output_dir)
        .with_context(|| format!("failed to create output dir {}", output_dir))?;

    // Build output file names
    let img_name = req
        .output_name
        .clone()
        .unwrap_or_else(|| format!("composed_{}.webp", Utc::now().timestamp()));
    let img_path = Path::new(output_dir).join(&img_name);
    let mut out_file = BufWriter::new(File::create(&img_path)?);

    // Write WebP
    let mut encoder = WebPEncoder::new_lossless(&mut out_file);
    encoder
        .encode(&bg, bg.width(), bg.height(), image::ColorType::Rgba8.into())
        .with_context(|| format!("failed writing webp to {:?}", img_path))?;

    // Write metadata JSON next to the image
    let meta_name = format!("{}.meta.json", img_name);
    let meta_path = Path::new(output_dir).join(&meta_name);
    let meta_file = File::create(&meta_path)?;
    serde_json::to_writer_pretty(
        meta_file,
        &serde_json::json!({ "clickable_zones": click_zones }),
    )?;

    Ok((
        img_path.to_string_lossy().to_string(),
        meta_path.to_string_lossy().to_string(),
    ))
}

/// Overlay `src` on top of `dest` at integer coordinates (paste_x, paste_y).
/// Handles negative paste coordinates and clipping; performs simple alpha blending.
fn overlay_with_clip(dest: &mut RgbaImage, src: &RgbaImage, paste_x: i32, paste_y: i32) {
    let dest_w = dest.width() as i32;
    let dest_h = dest.height() as i32;
    let src_w = src.width() as i32;
    let src_h = src.height() as i32;

    // Offsets into src and dest
    let mut src_x = 0;
    let mut src_y = 0;
    let mut dst_x = paste_x;
    let mut dst_y = paste_y;

    if dst_x < 0 {
        src_x = -dst_x;
        dst_x = 0;
    }
    if dst_y < 0 {
        src_y = -dst_y;
        dst_y = 0;
    }

    let copy_w = (src_w - src_x).min(dest_w - dst_x);
    let copy_h = (src_h - src_y).min(dest_h - dst_y);
    if copy_w <= 0 || copy_h <= 0 {
        return;
    }

    for yy in 0..copy_h {
        for xx in 0..copy_w {
            let sx = (src_x + xx) as u32;
            let sy = (src_y + yy) as u32;
            let dx = (dst_x + xx) as u32;
            let dy = (dst_y + yy) as u32;

            let sp = src.get_pixel(sx, sy);
            let dp = dest.get_pixel_mut(dx, dy);

            let alpha = (sp[3] as f32) / 255.0;
            if alpha >= 0.999 {
                *dp = *sp;
            } else if alpha > 0.0 {
                for c in 0..3 {
                    dp[c] = ((sp[c] as f32) * alpha + (dp[c] as f32) * (1.0 - alpha)) as u8;
                }
                // keep dest alpha opaque
                dp[3] = 255u8;
            }
        }
    }
}

/// Compute the 4 rotated corners (top-left, top-right, bottom-right, bottom-left)
/// rotated around the center by angle_deg (degrees CCW).
fn rotated_corners(x: f32, y: f32, w: f32, h: f32, angle_deg: f32) -> [Corner; 4] {
    let angle = angle_deg.to_radians();
    let cx = x + w / 2.0;
    let cy = y + h / 2.0;
    let raw = [(x, y), (x + w, y), (x + w, y + h), (x, y + h)];
    let mut out: [Corner; 4] = [Corner { x: 0.0, y: 0.0 }; 4];
    for (i, (px, py)) in raw.iter().enumerate() {
        let dx = px - cx;
        let dy = py - cy;
        let nx = dx * angle.cos() - dy * angle.sin() + cx;
        let ny = dx * angle.sin() + dy * angle.cos() + cy;
        out[i] = Corner {
            x: (nx * 100.0).round() / 100.0,
            y: (ny * 100.0).round() / 100.0,
        };
    }
    out
}

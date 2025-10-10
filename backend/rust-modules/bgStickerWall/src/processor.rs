use crate::helper::Rect;
use crate::model::{ClickZone, ComposeRequest, Corner};
use anyhow::{Context, Result};
use chrono::Utc;
use image::codecs::webp::WebPEncoder;
use image::imageops;
use image::{Rgba, RgbaImage};
use imageproc::geometric_transformations::{rotate_about_center, Interpolation};
use std::fs::{create_dir_all, File};
use std::io::BufWriter;
use std::path::Path;

pub fn compose(
    asset_root: &str,
    output_dir: &str,
    req: &ComposeRequest,
) -> Result<(String, String)> {
    // open background
    let bg_path = Path::new(asset_root).join(&req.background);
    let mut bg: RgbaImage = image::open(&bg_path)
        .with_context(|| format!("failed to open background {:?}", bg_path))?
        .to_rgba8();

    let mut click_zones: Vec<ClickZone> = Vec::new();

    // --- STEP 1: precompute rects and visibility ---
    let mut rects: Vec<(usize, Rect)> = Vec::new();
    for (i, st) in req.stickers.iter().enumerate() {
        let (w, h) = (st.width as f32, st.height as f32);
        rects.push((i, Rect::aabb_with_rotation(st.x, st.y, w, h, st.rotation)));
    }

    // visibility flags (true = visible)
    let mut visible = vec![true; req.stickers.len()];

    for i in (0..rects.len()).rev() {
        // start from topmost sticker
        let (idx, rect) = &rects[i];
        let mut overlap_area = 0.0;
        for j in 0..i {
            let (_, other) = &rects[j];
            overlap_area += rect.overlap(other);
        }
        let coverage_ratio = overlap_area / rect.area();
        if coverage_ratio >= 0.95 {
            visible[*idx] = false;
        }
    }

    // --- STEP 2: draw visible stickers ---
    for (i, st) in req.stickers.iter().enumerate() {
        if !visible[i] {
            continue; // skip hidden stickers
        }

        let sticker_path = Path::new(asset_root).join(&st.file);
        let sticker = image::open(&sticker_path)
            .with_context(|| format!("failed to open sticker {:?}", sticker_path))?
            .to_rgba8();

        let rotated = rotate_about_center(
            &sticker,
            st.rotation.to_radians(),
            Interpolation::Bilinear,
            Rgba([0, 0, 0, 0]),
        );

        imageops::overlay(&mut bg, &rotated, st.x as i64, st.y as i64);

        // ---- only add visible stickers to JSON ----
        let (w, h) = (st.width as f32, st.height as f32);
        click_zones.push(ClickZone {
            id: st.id.clone(),
            corners: [
                Corner { x: st.x, y: st.y },
                Corner {
                    x: st.x + w,
                    y: st.y,
                },
                Corner {
                    x: st.x + w,
                    y: st.y + h,
                },
                Corner {
                    x: st.x,
                    y: st.y + h,
                },
            ],
        });
    }

    // --- write output image and metadata ---
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
        .encode(&bg, bg.width(), bg.height(), image::ColorType::Rgba8.into())
        .with_context(|| format!("failed writing webp to {:?}", img_path))?;

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

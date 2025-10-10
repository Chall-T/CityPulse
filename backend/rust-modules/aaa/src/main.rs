use image::{imageops, Rgba, RgbaImage};
use imageproc::geometric_transformations::{rotate_about_center, Interpolation};
use serde::Deserialize;
use std::fs;

#[derive(Debug, Clone, Deserialize)]
struct Sticker {
    id: String,
    file: String,
    x: f32,
    y: f32,
    rotation: f32,
    width: u32,
    height: u32,
}

#[derive(Debug, Clone, Deserialize)]
struct InputData {
    background: String,
    stickers: Vec<Sticker>,
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load JSON
    let json_data = fs::read_to_string("compose_request.json")?;
    let input: InputData = serde_json::from_str(&json_data)?;

    // Load background image
    let mut bg_img = image::open(&input.background)?.to_rgba8();
    let (bg_w, bg_h) = bg_img.dimensions();

    // Occlusion mask — tracks pixels already covered by top stickers
    let mut mask = vec![false; (bg_w * bg_h) as usize];
    let mut visible_stickers = Vec::new();

    // Process stickers bottom → top (in original JSON order)
    for sticker in &input.stickers {
        let img = image::open(&sticker.file)?.to_rgba8();
        let resized = image::imageops::resize(
            &img,
            sticker.width,
            sticker.height,
            image::imageops::FilterType::Lanczos3,
        );

        // Pad image to prevent cropping during rotation
        let diag = ((sticker.width.pow(2) + sticker.height.pow(2)) as f32)
            .sqrt()
            .ceil() as u32;
        let mut padded = RgbaImage::from_pixel(diag, diag, Rgba([0, 0, 0, 0]));
        let offset_x = (diag as f32 - sticker.width as f32) / 2.0;
        let offset_y = (diag as f32 - sticker.height as f32) / 2.0;
        imageops::overlay(&mut padded, &resized, offset_x as i64, offset_y as i64);

        // Rotate around center of padded image
        let rotated = rotate_about_center(
            &padded,
            sticker.rotation.to_radians(),
            Interpolation::Nearest,
            Rgba([0, 0, 0, 0]),
        );

        // Adjust overlay position so sticker is correctly centered on its x/y
        let draw_x = sticker.x as f32 - offset_x;
        let draw_y = sticker.y as f32 - offset_y;

        // --- visibility & mask logic below stays identical ---
        let mut visible = false;
        for y in 0..rotated.height() {
            for x in 0..rotated.width() {
                let px = sticker.x as i64 + x as i64;
                let py = sticker.y as i64 + y as i64;
                if px < 0 || py < 0 || px >= bg_w as i64 || py >= bg_h as i64 {
                    continue;
                }
                let idx = (py as u32 * bg_w + px as u32) as usize;
                let pix = rotated.get_pixel(x, y);
                if pix[3] > 0 && !mask[idx] {
                    visible = true;
                }
            }
        }

        if visible {
            for y in 0..rotated.height() {
                for x in 0..rotated.width() {
                    let px = sticker.x as i64 + x as i64;
                    let py = sticker.y as i64 + y as i64;
                    if px < 0 || py < 0 || px >= bg_w as i64 || py >= bg_h as i64 {
                        continue;
                    }
                    let idx = (py as u32 * bg_w + px as u32) as usize;
                    let pix = rotated.get_pixel(x, y);
                    if pix[3] > 0 {
                        mask[idx] = true;
                    }
                }
            }

            // 🧩 Corrected overlay coordinates
            image::imageops::overlay(&mut bg_img, &rotated, draw_x as i64, draw_y as i64);

            // --- same corner computation and visible_stickers push as before ---
            let rad = sticker.rotation.to_radians();
            let cos = rad.cos();
            let sin = rad.sin();
            let w = sticker.width as f32;
            let h = sticker.height as f32;
            let (x, y) = (sticker.x, sticker.y);

            let corners = vec![
                (x, y),
                (x + w * cos, y + w * sin),
                (x + w * cos - h * sin, y + w * sin + h * cos),
                (x - h * sin, y + h * cos),
            ];

            visible_stickers.push(serde_json::json!({
                "id": sticker.id,
                "corners": corners
            }));
        }
    }

    // Save composed image
    bg_img.save("output.png")?;

    // Save JSON
    fs::write(
        "visible_stickers.json",
        serde_json::to_string_pretty(&visible_stickers)?,
    )?;

    println!(
        "✅ Done — rendered output.png and visible_stickers.json ({} visible)",
        visible_stickers.len()
    );

    Ok(())
}

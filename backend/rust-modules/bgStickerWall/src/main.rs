mod model; 
mod processor; 
use actix_web::{post, web, App, HttpResponse, HttpServer, Responder}; 
use log::info; 
use std::env; 
use model::InputData; 
use lazy_static::lazy_static;
use std::sync::Arc;
use std::path::Path;
use image::RgbaImage;
use std::time::Duration;

lazy_static! {
    pub static ref BG_IMAGE: RgbaImage = {
        let path = Path::new("../../images/sticker_bg/clean/bg_tiles.webp");
        println!("Preloading background: {:?}", path);
        image::open(path)
            .expect("Failed to load background")
            .to_rgba8()
    };
    pub static ref BG_IMAGE_VERT: RgbaImage = {
        let path = Path::new("../../images/sticker_bg/clean/bg_tiles_vert.webp");
        println!("Preloading background: {:?}", path);
        image::open(path)
            .expect("Failed to load background")
            .to_rgba8()
    };
}

#[post("/compose")] 
async fn compose(req: web::Json<InputData>) -> impl Responder {
    let asset_root = env::var("ASSET_PATH").unwrap_or_else(|_| "../../images".into()); 
    let output_dir = env::var("OUTPUT_DIR").unwrap_or_else(|_| "../../images/sticker_bg".into()); 
    match processor::compose_bgs(&asset_root, &output_dir, &req.into_inner()) { 
        Ok((image_path, meta_path)) => { 
            let body = serde_json::json!({ "image": image_path, "metadata": meta_path }); 
            HttpResponse::Ok().json(body) 
        } Err(e) => { 
            HttpResponse::InternalServerError().body(format!("Error composing image: {:?}", e)) 
        } 
    } 
}

#[post("/remove_old")]
async fn remove_old() -> impl Responder {
    let dir = "../../images/sticker_bg/";
    let max_age = Duration::from_secs(24 * 60 * 60);

    let _ = processor::cleanup_old_files_by_name(dir, max_age);

    HttpResponse::Ok().json(serde_json::json!({
        "status": "cleanup attempted",
        "dir": dir,
        "max_age_secs": max_age.as_secs()
    }))
}


#[actix_web::main]
async fn main() -> std::io::Result<()> { 
    env_logger::init(); 
    let bind = std::env::var("BIND").unwrap_or_else(|_| "0.0.0.0:8080".into()); 
    info!("Starting rust-image-service on http://{}", bind); 
    println!("Listening on http://{}", bind);

    HttpServer::new(|| {
        App::new()
            .service(compose)
            .service(remove_old)  
    })
    .bind(bind)?
    .run()
    .await
}
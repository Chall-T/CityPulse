mod model; 
mod processor; 
use actix_web::{post, web, App, HttpResponse, HttpServer, Responder}; 
use log::info; 
use std::env; 
use model::InputData; 

#[post("/compose")] 
async fn compose(req: web::Json<InputData>) -> impl Responder {
    let asset_root = env::var("ASSET_PATH").unwrap_or_else(|_| "../../images".into()); 
    let output_dir = env::var("OUTPUT_DIR").unwrap_or_else(|_| "../../images".into()); 
    match processor::compose_image(&asset_root, &output_dir, &req.into_inner()) { 
        Ok((image_path, meta_path)) => { 
            let body = serde_json::json!({ "image": image_path, "metadata": meta_path }); 
            HttpResponse::Ok().json(body) 
        } Err(e) => { 
            HttpResponse::InternalServerError().body(format!("Error composing image: {:?}", e)) 
        } 
    } 
}

#[actix_web::main]
async fn main() -> std::io::Result<()> { 
    env_logger::init(); 
    let bind = std::env::var("BIND").unwrap_or_else(|_| "0.0.0.0:8080".into()); 
    info!("Starting rust-image-service on http://{}", bind); 
    println!("Listening on http://{}", bind);
    HttpServer::new(|| App::new().service(compose))
        .bind(bind)?
        .run()
        .await
}
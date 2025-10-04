import dotenv from "dotenv";
import fs from "fs";

// checking if .env file is available
if (fs.existsSync(".env")) {
  dotenv.config({ path: ".env" });
} else {
  console.error(".env file not found.");
}

export const ENVIRONMENT = process.env.NODE_ENV;
export const isProd = ENVIRONMENT === "production";

const backendUrl = new URL(process.env.BACKEND_URL || '');
export const API_PATH = `${backendUrl.pathname.replace(/\/$/, '')}`;


export const PORT = (backendUrl.port || 1000) as number;

// selecting the database URI as per the environment
export const DB_URI = isProd
  ? (process.env.DATABASE_URL_PROD as string)
  : (process.env.DATABASE_URL_DEV as string);

if (!DB_URI) {
  if (isProd) {
    console.error(
      "No db connection string. Set DATABASE_URL_PROD environment variable."
    );
  } else {
    console.error(
      "No db connection string. Set DATABASE_URL_DEV environment variable."
    );
  }
  process.exit(1);
}


export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string;

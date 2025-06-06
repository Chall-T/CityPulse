import { ALLOWED_IMAGE_DOMAINS } from "../config/general";
import { isProd } from '../utils/secrets';


export const isWithinBerlin = (lat: number, lng: number): boolean => {
    const BERLIN_EXTENT = {
        minLng: 13.088345,
        maxLng: 13.7611609,
        minLat: 52.3382448,
        maxLat: 52.6755087,
    };

    return (
        lat >= BERLIN_EXTENT.minLat &&
        lat <= BERLIN_EXTENT.maxLat &&
        lng >= BERLIN_EXTENT.minLng &&
        lng <= BERLIN_EXTENT.maxLng
    );
};

export const isSafeURL = (url: string): boolean => {
    if (!isProd){ 
        return true
    }
    let parsedUrl: URL;

    try {
        parsedUrl = new URL(url);
    } catch {
        return false
    }

    if (parsedUrl.protocol !== "https:") {
        return false
    }

    const hostname = parsedUrl.hostname.toLowerCase();

    if (!ALLOWED_IMAGE_DOMAINS.has(hostname)) {
        return false
    }

    // prevents SSRF
    const forbiddenHosts = ["localhost", "127.0.0.1", "::1"];
    if (forbiddenHosts.includes(hostname)) {
        return false
    }

    return true

}
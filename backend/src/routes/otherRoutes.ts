import express, { Request, Response } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import * as cheerio from 'cheerio';
import { Readable } from 'stream';
const SERVER_URL = process.env.SERVER_URL || 'http://localhost';
const PORT = process.env.PORT || '1000';

const router = express.Router();


router.get('/wikidata', authenticate, async (req, res) => {
  const response = await fetch(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${req.query.query}&props=claims&format=json`);
  const data = await response.json();
  res.json(data);
});

router.get('/image', async (req, res) => {
  const imageUrl = req.query.url as string;

  if (!imageUrl) {
    return res.status(400).send('Missing image URL');
  }

  try {
    const response = await fetch(imageUrl);

    if (!response.ok || !response.body) {
      return res.status(500).send('Failed to fetch image');
    }

    // Get content type
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);

    // 👉 Convert Web ReadableStream to Node Readable with `fromWeb()`
    const nodeStream = Readable.fromWeb(response.body as any); // 👈 force it past the TS check

    nodeStream.pipe(res);
  } catch (error) {
    console.error('Fetch failed:', error);
    res.status(500).send('Server error');
  }
});


router.get('/images', authenticate, async (req: Request, res: Response) => {
  let limit = parseInt(req.query.limit as string) || 10;
  if (limit > 30) {
    limit = 30;
  }
  function filterImageUrls(urls: string[]): string[] {
    const seen = new Set<string>();

    return urls.filter((url) => {
      // 1. Skip data URIs (base64 or inline SVG)
      if (url.startsWith("data:image")) return false;

      // 2. Skip known transparent SVGs (look for fill-opacity="0")
      if (decodeURIComponent(url).includes('fill-opacity="0"')) return false;

      // 3. Skip dummy or placeholder images
      const lower = url.toLowerCase();
      if (lower.includes("dummy.png") || lower.includes("placeholder")) return false;

      // 4. Skip duplicates
      if (seen.has(url)) return false;
      seen.add(url);

      return true;
    }).map((url) => {
      // Rebuild with proxy
      const encoded = encodeURIComponent(url);
      return `${SERVER_URL}:${PORT}/api/image?url=${encoded}`;
    });
  }
  try {
    const targetUrl = req.query.url as string | undefined;
    console.log(req.params)
    if (!targetUrl) {
      return res.status(400).json({ error: 'Missing url query parameter' });
    }

    // Validate URL (basic)
    try {
      new URL(targetUrl);
    } catch {
      return res.status(400).json({ error: 'Invalid url parameter' });
    }

    const response = await fetch(targetUrl);
    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to fetch target URL' });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const images: string[] = [];

    $('img').each((_, img) => {
      let src = $(img).attr('src');
      if (src && images.length < limit) {
        // Convert relative URLs to absolute
        if (src.startsWith('//')) {
          src = new URL(targetUrl).protocol + src;
        } else if (src.startsWith('/')) {
          src = new URL(src, targetUrl).href;
        } else if (!src.startsWith('http')) {
          src = new URL(src, targetUrl).href;
        }
        images.push(src);
      }
    });

    res.json({ images: filterImageUrls(images) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



export default router;
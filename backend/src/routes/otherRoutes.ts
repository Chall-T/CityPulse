import express, { Request, Response } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import * as cheerio from 'cheerio';


const router = express.Router();


router.get('/wikidata', authenticate, async (req, res) => {
  const response = await fetch(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${req.query.query}&props=claims&format=json`);
  const data = await response.json();
  res.json(data);
});

router.get('/images', authenticate, async (req: Request, res: Response) => {
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
      if (src) {
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

    res.json({ images });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



export default router;
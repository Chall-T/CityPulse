import express from 'express';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();


router.get('/wikidata', authenticate, async (req, res) => {
  const response = await fetch(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${req.query.query}&props=claims&format=json`);
  const data = await response.json();
  res.json(data);
});

export default router;
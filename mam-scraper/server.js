const express = require('express');
const cors    = require('cors');
const fetch   = require('node-fetch');
const cheerio = require('cheerio');

const app  = express();
const PORT = process.env.PORT || 3210;

app.use(cors());
app.use(express.json());

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
};

function extractPrice(text) {
  if (!text) return null;
  const m = String(text).replace(/,/g, '').match(/[\d]+\.?\d{0,2}/);
  return m ? parseFloat(m[0]) : null;
}

function guessCategory(title, url) {
  const s = (title + ' ' + url).toLowerCase();
  if (/wig|hair|lace|weave|braid/.test(s))                          return 'hair';
  if (/lipstick|foundation|mascara|makeup|beauty|cosmetic|lip/.test(s)) return 'beauty';
  if (/dress|blouse|skirt|ankara|fashion|shirt|top|jeans|trouser/.test(s)) return 'fashion';
  if (/necklace|bracelet|earring|ring|jewel|accessory/.test(s))     return 'accessories';
  if (/serum|cream|lotion|sunscreen|moisturizer|skincare|soap|toner/.test(s)) return 'skincare';
  if (/shoe|heel|sandal|boot|sneaker|slipper|footwear/.test(s))     return 'footwear';
  return 'fashion';
}

app.get('/scrape', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url param required' });

  try {
    const response = await fetch(url, { headers: HEADERS, timeout: 12000, redirect: 'follow' });
    const html     = await response.text();
    const $        = cheerio.load(html);

    // Title
    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').text().split('|')[0].split(':')[0].trim() ||
      $('h1').first().text().trim() ||
      'Product';

    // Image
    let image =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      $('meta[property="og:image:secure_url"]').attr('content') || '';

    if (!image && url.includes('amazon')) {
      image = $('#landingImage, #imgBlkFront, #main-image').attr('src') ||
              $('[data-old-hires]').attr('data-old-hires') || '';
    }
    if (!image && url.includes('jumia')) {
      image = $('article img').first().attr('src') ||
              $('[class*="gallery"] img').first().attr('src') || '';
    }
    if (!image) {
      $('img').each((_, el) => {
        const src = $(el).attr('src') || '';
        const w   = parseInt($(el).attr('width') || '0');
        if (!image && src && (w > 100 || /product|item|main/i.test(src))) image = src;
      });
    }

    if (image && image.startsWith('//')) image = 'https:' + image;
    if (image && image.startsWith('/')) {
      try { image = new URL(image, url).href; } catch(e) {}
    }

    // Price
    let price = null;
    price = extractPrice($('meta[property="product:price:amount"]').attr('content'));
    if (!price) price = extractPrice($('.a-price .a-offscreen').first().text());
    if (!price) price = extractPrice($('#priceblock_ourprice, #priceblock_dealprice, .a-color-price').first().text());
    if (!price) price = extractPrice($('[class*="prc"]').first().text());
    if (!price) price = extractPrice($('[itemprop="price"]').attr('content') || $('[itemprop="price"]').text());
    if (!price) price = extractPrice($('[class*="price"]').first().text());

    const category  = guessCategory(title, url);
    const cleanTitle = title.replace(/\s+/g, ' ').trim().substring(0, 120);

    res.json({ title: cleanTitle, image, price, category, source: url });

  } catch (err) {
    console.error('Scrape error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'mam-scraper' }));

app.listen(PORT, () => console.log(`MAM Scraper running on port ${PORT}`));

// Public: the catalogue and shop details the website shows.
const { readCatalog } = require("./_store");

module.exports = async (req, res) => {
  try {
    const { products, settings } = await readCatalog();
    // Short CDN cache so saves from the admin page show up within about a minute
    res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=300");
    res.json({ products, settings });
  } catch (e) {
    res.setHeader("Cache-Control", "no-store");
    res.status(502).json({ error: "The catalogue is temporarily unavailable." });
  }
};

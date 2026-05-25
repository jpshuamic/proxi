const pool = require("../config/database");

const createListing = async (req, res) => {
  const { title, description, category, price, price_type, quantity_available, condition, delivery_available, location_lat, location_lng, area_description, images, cover_image } = req.body;
  try {
    if (!title || !category || !price) return res.status(400).json({ success: false, message: "Title, category and price are required" });
    const newListing = await pool.query(
      `INSERT INTO listings (seller_id, title, description, category, price, price_type, quantity_available, condition, delivery_available, location_lat, location_lng, area_description, images, cover_image)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [req.user.id, title, description || null, category, price, price_type || "fixed", quantity_available || 1, condition || "used_good", delivery_available || false, location_lat || null, location_lng || null, area_description || null, JSON.stringify(images || []), cover_image || null]
    );
    res.status(201).json({ success: true, message: "Listing created successfully", listing: newListing.rows[0] });
  } catch (error) {
    console.error("Create listing error:", error);
    res.status(500).json({ success: false, message: "Server error creating listing" });
  }
};

const getListings = async (req, res) => {
  const { category, area, search } = req.query;
  try {
    let query = `SELECT l.*, u.full_name as seller_name, u.proxi_score as seller_score, u.score_tier as seller_tier FROM listings l JOIN users u ON l.seller_id = u.id WHERE l.status = 'active'`;
    const params = [];
    if (category) { params.push(category); query += ` AND l.category = $${params.length}`; }
    if (area) { params.push(`%${area}%`); query += ` AND l.area_description ILIKE $${params.length}`; }
    if (search) { params.push(`%${search}%`); query += ` AND (l.title ILIKE $${params.length} OR l.description ILIKE $${params.length})`; }
    query += " ORDER BY l.created_at DESC LIMIT 50";
    const listings = await pool.query(query, params);
    res.json({ success: true, count: listings.rows.length, listings: listings.rows });
  } catch (error) {
    console.error("Get listings error:", error);
    res.status(500).json({ success: false, message: "Server error fetching listings" });
  }
};

const getListing = async (req, res) => {
  try {
    const listing = await pool.query(
      `SELECT l.*, u.full_name as seller_name, u.proxi_score as seller_score, u.score_tier as seller_tier, u.phone_number as seller_phone FROM listings l JOIN users u ON l.seller_id = u.id WHERE l.id = $1 AND l.status = 'active'`,
      [req.params.id]
    );
    if (listing.rows.length === 0) return res.status(404).json({ success: false, message: "Listing not found" });
    await pool.query("UPDATE listings SET view_count = view_count + 1 WHERE id = $1", [req.params.id]);
    res.json({ success: true, listing: listing.rows[0] });
  } catch (error) {
    console.error("Get listing error:", error);
    res.status(500).json({ success: false, message: "Server error fetching listing" });
  }
};

const getMyListings = async (req, res) => {
  try {
    const listings = await pool.query("SELECT * FROM listings WHERE seller_id = $1 ORDER BY created_at DESC", [req.user.id]);
    res.json({ success: true, count: listings.rows.length, listings: listings.rows });
  } catch (error) {
    console.error("Get my listings error:", error);
    res.status(500).json({ success: false, message: "Server error fetching your listings" });
  }
};

module.exports = { createListing, getListings, getListing, getMyListings };

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const pool = require("./config/database");
const authRoutes = require("./routes/auth");
const listingsRoutes = require("./routes/listings");
const tasksRoutes = require("./routes/tasks");
const walletRoutes = require("./routes/wallet");
const reviewsRoutes = require("./routes/reviews");
const disputesRoutes = require("./routes/disputes");
const paystackRoutes = require("./routes/paystack");
const messagesRoutes = require("./routes/messages");
const { protect } = require("./middleware/auth");

const app = express();
app.set("trust proxy", 1);
app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: "Too many requests" });
app.use(limiter);

app.use("/api/auth", authRoutes);
app.use("/api/listings", listingsRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/disputes", disputesRoutes);
app.use("/api/paystack", paystackRoutes);
app.use("/api/messages", messagesRoutes);

app.post("/api/ai/detect", async (req, res) => {
  const { input } = req.body;
  if (!input) return res.status(400).json({ success: false, message: "Input required" });
  try {
    const words = input.toLowerCase().trim().split(" ");
    let bestMatch = null;
    let highestCount = 0;
    const fullPhrase = await pool.query(
      `SELECT * FROM search_patterns WHERE search_term = $1 ORDER BY search_count DESC LIMIT 1`,
      [input.toLowerCase().trim()]
    );
    if (fullPhrase.rows.length > 0) bestMatch = fullPhrase.rows[0];
    if (!bestMatch) {
      for (const word of words) {
        if (word.length < 3) continue;
        const result = await pool.query(
          `SELECT * FROM search_patterns WHERE search_term ILIKE $1 ORDER BY search_count DESC LIMIT 1`,
          [`%${word}%`]
        );
        if (result.rows.length > 0 && result.rows[0].search_count > highestCount) {
          bestMatch = result.rows[0];
          highestCount = result.rows[0].search_count;
        }
      }
    }
    if (!bestMatch) return res.json({ success: false, message: "No match found" });
    await pool.query(
      `UPDATE search_patterns SET search_count = search_count + 1, updated_at = NOW() WHERE id = $1`,
      [bestMatch.id]
    );
    res.json({
      success: true,
      result: {
        category: bestMatch.category,
        subcategory: bestMatch.search_term,
        listing_type: bestMatch.listing_type,
        suggested_form: bestMatch.suggested_form,
      }
    });
  } catch (e) {
    console.error("Search detect error:", e.message);
    res.status(500).json({ success: false, message: "Detection failed" });
  }
});

app.get("/", (req, res) => { res.json({ message: "Proxi API is running", version: "1.0.0" }); });
app.use((req, res) => { res.status(404).json({ message: "Route not found" }); });
app.use((err, req, res, next) => { console.error(err.stack); res.status(500).json({ message: "Something went wrong" }); });

const PORT = process.env.PORT || 5000;
pool.query("SELECT 1")
  .then(() => {
    console.log("Connected to Proxi database");
    app.listen(PORT, () => { console.log("Proxi server running on port " + PORT); });
  })
  .catch((err) => { console.error("Failed to connect:", err); process.exit(1); });

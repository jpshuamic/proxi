const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");

router.post("/initialize", protect, async (req, res) => {
  const { amount, email } = req.body;
  try {
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { "Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amount * 100, email })
    });
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ success: false, message: "Paystack error" });
  }
});

router.get("/verify/:reference", protect, async (req, res) => {
  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${req.params.reference}`, {
      headers: { "Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
    });
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ success: false, message: "Verification error" });
  }
});

module.exports = router;

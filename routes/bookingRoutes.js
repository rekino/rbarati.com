const express = require("express");
const router = express.Router();
const { getAvailableSlots, bookSession } = require("../controllers/bookingController");

router.get("/availability", async (req, res) => {
  try {
    const { date, duration } = req.query;
    if (!date || !duration) return res.status(400).json({ error: "Missing parameters" });

    const slots = await getAvailableSlots(date, parseInt(duration));
    res.json({ slots });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/book", async (req, res) => {
  try {
    const { date, time, duration } = req.body;
    await bookSession(date, time, parseInt(duration));
    res.json({ message: "Booking successful" });
  } catch (error) {
    res.status(500).json({ error: "Booking failed" });
  }
});

router.get("/", async (req, res) => {
    res.render("booking", { title: "Home Page" });
});

module.exports = router;

const express = require("express");
const router = express.Router();
const { getAvailableSlots, bookSession } = require("../controllers/bookingController");

duration = {
    free: 15,
    support: 30,
    full: 60
}

// Endpoint to retrieve available time slots
router.get("/availability", async (req, res) => {
    try {
        const { date, type } = req.query;
        if (!date || !type) {
        return res.status(400).json({ error: "Missing parameters" });
        }
        const slots = await getAvailableSlots(date, duration[type]);
        res.json({ slots });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Endpoint to book a session
router.post("/book", async (req, res) => {
    try {
        const { date, time, duration, userEmail } = req.body;
        if (!date || !time || !duration || !userEmail) {
        return res.status(400).json({ error: "Missing booking parameters" });
        }
        const event = await bookSession(date, time, parseInt(duration), userEmail);
        res.json({ message: "Booking successful", event });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Booking failed" });
    }
});

router.get("/", async (req, res) => {
    res.render("booking", { title: "Book an Appointment", type: req.query.type });
});

module.exports = router;

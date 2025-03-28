const express = require("express");
const router = express.Router();
const { getAvailableSlots, bookSession } = require("../controllers/bookingController");
const { addDays, format, parseISO, differenceInDays } = require("date-fns");

// Constants for date filtering
const MIN_DAYS_AHEAD = 1; // At least tomorrow
const MAX_DAYS_AHEAD = 30; // Max one month ahead

router.get("/availability", async (req, res) => {
    try {
        const { date, type } = req.query;

        // If no specific date is provided, return valid future dates
        if (!date) {
            const availableDates = [];
            const today = new Date();

            for (let i = MIN_DAYS_AHEAD; i <= MAX_DAYS_AHEAD; i++) {
                const futureDate = addDays(today, i);
                availableDates.push(format(futureDate, "yyyy-MM-dd"));
            }

            return res.json({ dates: availableDates });
        }

        // Parse the provided date
        const selectedDate = parseISO(date);
        const today = new Date();

        // Validate date range
        const daysAhead = differenceInDays(selectedDate, today);
        if (daysAhead < MIN_DAYS_AHEAD || daysAhead > MAX_DAYS_AHEAD) {
            return res.json({ slots: [] });
        }

        // Fetch available slots from Google Calendar
        const availableSlots = await checkAvailability(selectedDate, type);
        res.json({ slots: availableSlots });

    } catch (error) {
        console.error("Error fetching availability:", error);
        res.status(500).json({ error: "Failed to fetch availability." });
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
    res.render("booking", { title: "Book an Appointment", type: req.query.type });
});

module.exports = router;

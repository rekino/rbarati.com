import express, { NextFunction, Request, Response } from "express";
const router = express.Router();
import {
  getAvailableSlots,
  bookSession,
} from "../controllers/bookingController";

const duration: Record<string, number> = {
  free: 15,
  support: 30,
  full: 60,
};

// Endpoint to retrieve available time slots
router.get("/availability", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date, type } = req.query;

    if (!date || !type) {
      res.status(400).json({ error: "Missing parameters" });
      return;
    }

    if (typeof date !== 'string' || typeof type !== 'string') {
      res.status(400).json({ error: 'invalid parameters' });
      return;
    }

    if (!(type in duration)) {
      res.status(400).json({ error: 'Invalid booking type' });
      return;
    }

    const slots = await getAvailableSlots(date, duration[type]);
    res.json({ slots });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint to book a session
router.post("/book", async (req: Request, res: Response) => {
  try {
    if (!req.user){
      res.status(400).json({ error: "Not logged in" });
      return;
    }

    const { date, time, type } = req.body;

    if (!date || !time || !type) {
      res.status(400).json({ error: "Missing booking parameters" });
      return;
    }

    const event = await bookSession(date, time, duration[type], req.user.email);
    res.json({ message: "Booking successful", event });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Booking failed" });
  }
});

router.get("/", async (req, res) => {
  res.render("booking", { title: "Book an Appointment", type: req.query.type });
});

export default router;

const { google } = require("googleapis");
const nodemailer = require("nodemailer");
const calendar = google.calendar("v3");

async function getAvailableSlots(date, duration) {
  // Fetch events from Google Calendar
  const auth = await getGoogleAuth();
  const events = await calendar.events.list({
    auth,
    calendarId: "primary",
    timeMin: `${date}T09:00:00+01:00`,
    timeMax: `${date}T16:00:00+01:00`,
    singleEvents: true,
    orderBy: "startTime",
  });

  const bookedTimes = events.data.items.map(event => new Date(event.start.dateTime));
  const availableSlots = [];

  for (let hour = 9; hour < 16; hour += duration / 60) {
    for (let minute = 0; minute < 60; minute += 15) {
      const slotTime = new Date(`${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+01:00`);
      if (!bookedTimes.some(booked => Math.abs(booked - slotTime) < duration * 60000)) {
        availableSlots.push(slotTime.toISOString().split("T")[1].slice(0, 5)); // "HH:MM" format
      }
    }
  }
  
  return availableSlots;
}

async function bookSession(date, time, duration) {
  const auth = await getGoogleAuth();
  const event = {
    summary: "Consultation with Ramin",
    start: { dateTime: `${date}T${time}:00+01:00`, timeZone: "Europe/Amsterdam" },
    end: { dateTime: new Date(new Date(`${date}T${time}:00+01:00`).getTime() + duration * 60000).toISOString(), timeZone: "Europe/Amsterdam" },
  };
  
  await calendar.events.insert({ auth, calendarId: "primary", resource: event });

  const transporter = nodemailer.createTransport({ service: "Gmail", auth: { user: "your-email@gmail.com", pass: "your-password" } });
  await transporter.sendMail({ to: "customer@example.com", subject: "Booking Confirmation", text: `Your session is booked for ${date} at ${time}.` });
}

async function getGoogleAuth() {
  const auth = new google.auth.GoogleAuth({
    credentials: require("../google-credentials.json"),
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
  return await auth.getClient();
}

module.exports = { getAvailableSlots, bookSession };

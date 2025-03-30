// controllers/bookingController.js

const { google } = require("googleapis");
const { v4: uuidv4 } = require("uuid");
const ics = require("ics");
const nodemailer = require("nodemailer");
const path = require("path");
const { addDays, format, parseISO, differenceInDays } = require("date-fns");
require("dotenv").config();

// Constants for date filtering
const MIN_DAYS_AHEAD = 1; // At least tomorrow
const MAX_DAYS_AHEAD = 30; // Max one month ahead

// Function to obtain a Google Auth client
async function getGoogleAuth() {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, "../google-credentials.json"),
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
  return await auth.getClient();
}

/**
 * Get available time slots for a given date and session duration.
 * - Date: in YYYY-MM-DD format.
 * - Duration: session length in minutes.
 * Returns an array of strings in "HH:MM" format.
 */
async function getAvailableSlots(date, duration) {
  // Parse the provided date
  const selectedDate = parseISO(date);
  const today = new Date();

  // Validate date range
  const daysAhead = differenceInDays(selectedDate, today);
  if (daysAhead < MIN_DAYS_AHEAD || daysAhead > MAX_DAYS_AHEAD) {
      return [];
  }

  const auth = await getGoogleAuth();
  const calendar = google.calendar({ version: "v3", auth });
  
  // Define working hours in CET (UTC+1)
  const timeMin = new Date(`${date}T09:00:00+01:00`).toISOString();
  const timeMax = new Date(`${date}T16:00:00+01:00`).toISOString();

  // Query free/busy data
  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      timeZone: "Europe/Amsterdam",
      items: [{ id: process.env.GOOGLE_CALENDAR_ID }],
    },
  });

  const busy = response.data.calendars[process.env.GOOGLE_CALENDAR_ID].busy; // array of busy periods

  // Generate available slots in 15-minute increments.
  const availableSlots = [];
  let slotTime = new Date(`${date}T09:00:00+01:00`);
  const endTime = new Date(`${date}T16:00:00+01:00`);
  
  while (slotTime < endTime) {
    let slotEndTime = new Date(slotTime.getTime() + duration * 60000);
    if (slotEndTime > endTime) break;

    // A slot is available if it doesn't conflict with any busy period.
    const slotAvailable = busy.every(busySlot => {
      const busyStart = new Date(busySlot.start);
      const busyEnd = new Date(busySlot.end);
      // No conflict if the entire slot is before the busy period or after.
      return slotEndTime <= busyStart || slotTime >= busyEnd;
    });

    if (slotAvailable) {
      // Format slot time as "HH:MM"
      availableSlots.push(slotTime.toISOString());
    }
    
    // Increment by 15 minutes
    slotTime = new Date(slotTime.getTime() + 15 * 60000);
  }
  
  return availableSlots;
}

/**
 * Books a session by creating an event in Google Calendar with a Jitsi conference,
 * then generates an ICS file and sends a confirmation email.
 *
 * - date: YYYY-MM-DD
 * - time: HH:MM (in CET)
 * - duration: session length in minutes
 * - userEmail: email address of the customer
 */
async function bookSession(date, time, duration, userEmail) {
  const auth = await getGoogleAuth();
  const calendar = google.calendar({ version: "v3", auth });
  
  // Construct start and end Date objects (assuming CET, UTC+1)
  const startDateTime = new Date(time);
  const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

  // Generate a unique Jitsi Meet room URL
  const jitsiRoom = `rbarati-${Date.parse(time)}`;
  const meetLink = `https://meet.jit.si/${jitsiRoom}`;
  
  // Build the event with Google Meet conference data
  const event = {
    summary: "Consultation with Ramin",
    description: "Consultation session booked via the website.",
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: "Europe/Amsterdam",
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: "Europe/Amsterdam",
    },
    location: meetLink,
  };

  // Insert the event into the calendar with conferenceDataVersion set to 1
  const response = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    resource: event,
    conferenceDataVersion: 1,
  });
  
  const createdEvent = response.data;
  
  // Prepare the event data for ICS file generation
  const eventForICS = {
    start: [
      startDateTime.getFullYear(),
      startDateTime.getMonth() + 1,
      startDateTime.getDate(),
      startDateTime.getHours(),
      startDateTime.getMinutes(),
    ],
    duration: { minutes: duration },
    title: "Consultation with Ramin",
    description: "Consultation session booked via the website.",
    location: createdEvent.hangoutLink || "Online Meeting",
    url: createdEvent.htmlLink,
    status: "CONFIRMED",
  };

  // Generate ICS file
  const { error, value } = ics.createEvent(eventForICS);
  if (error) {
    throw new Error("ICS generation failed: " + error);
  }

  let nodemailerConfig = {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  }

  if (process.env.NODE_ENV !== "production")
    nodemailerConfig.tls = {
      // Do not fail on invalid certs
      rejectUnauthorized: false
    }

  // Send confirmation email with ICS file attached
  const transporter = nodemailer.createTransport(nodemailerConfig);

  const mailOptions = {
    from: `"Ramin Barati" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: "Your Consultation Booking Confirmation",
    text: `Your consultation with Ramin is confirmed for ${date} at ${time} CET.
Google Meet Link: ${createdEvent.hangoutLink || "N/A"}

Please find attached an ICS file to add this event to your calendar.`,
    attachments: [
      {
        filename: "appointment.ics",
        content: value,
      },
    ],
  };

  await transporter.sendMail(mailOptions);

  return createdEvent;
}

module.exports = { getAvailableSlots, bookSession };

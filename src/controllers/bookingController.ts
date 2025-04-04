// controllers/bookingController.js

import { google } from "googleapis";
import { createEvent } from "ics";
import nodemailer from "nodemailer";
import path from "path";
import { parseISO, differenceInDays } from "date-fns";
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
  return auth;
}

/**
 * Get available time slots for a given date and session duration.
 * - Date: in YYYY-MM-DD format.
 * - Duration: session length in minutes.
 * Returns an array of strings in "HH:MM" format.
 */
export async function getAvailableSlots(date: string, duration: number) {
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

  if(!response.data.calendars){
    throw new Error("No google calendar found");
  }

  // array of busy periods
  const busy = response.data.calendars[process.env.GOOGLE_CALENDAR_ID as string].busy;

  if(!busy){
    throw new Error("budy object is undefined");
  }

  // Generate available slots in 15-minute increments.
  const availableSlots = [];
  let slotTime = new Date(`${date}T09:00:00+01:00`);
  const endTime = new Date(`${date}T16:00:00+01:00`);

  while (slotTime < endTime) {
    let slotEndTime = new Date(slotTime.getTime() + duration * 60000);
    if (slotEndTime > endTime) break;

    // A slot is available if it doesn't conflict with any busy period.
    const slotAvailable = busy.every((busySlot) => {
      const busyStart = new Date(busySlot.start as string);
      const busyEnd = new Date(busySlot.end as string);
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
export async function bookSession(
  date: string,
  time: string,
  duration: number,
  userEmail: string,
) {
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
    location: meetLink,
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: "Europe/Amsterdam",
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: "Europe/Amsterdam",
    },
  };

  // Insert the event into the calendar with conferenceDataVersion set to 1
  const response = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID as string,
    conferenceDataVersion: 1,
    requestBody: event,
  });

  const createdEvent = response.data;

  // Generate ICS file
  const { error, value } = createEvent({
    start: [
      startDateTime.getFullYear(),
      startDateTime.getMonth() + 1,
      startDateTime.getDate(),
      startDateTime.getHours(),
      startDateTime.getMinutes(),
    ],
    duration: { minutes: duration },
    title: "Consultation with Ramin",
    description: "Consultation session booked via the website",
    location: createdEvent.location || "Online Meeting",
    url: createdEvent.htmlLink || "www.rbarati.com",
    status: "CONFIRMED",
  });

  if (error) {
    throw new Error("ICS generation failed: " + error);
  }

  let nodemailerConfig = {
    host: process.env.EMAIL_HOST as string,
    port: parseInt(process.env.EMAIL_PORT || '456'),
    secure: true,
    auth: {
      user: process.env.EMAIL_USER as string,
      pass: process.env.EMAIL_PASS as string,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === "production",
    },
  };

  // Send confirmation email with ICS file attached
  const transporter = nodemailer.createTransport(nodemailerConfig);

  const mailOptions = {
    from: `"Ramin Barati" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: "Your Consultation Booking Confirmation",
    text: `Your consultation with Ramin is confirmed for ${time}.
Jitsi Room Link: ${createdEvent.location || "N/A"}

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

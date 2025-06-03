require("dotenv").config();

import http from "http";
import express from "express";
import session from "express-session";
import passport from "passport";
import path from "path";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
require("./config/passport");

import { IChatMessage } from "./models/chat";

import pageRoutes from "./routes/pages";
import authRoutes from "./routes/authRoutes";
import chatRoutes from "./routes/chatRoutes";
import bookingRoutes from "./routes/bookingRoutes";
import rfpRoutes from "./routes/rfpRoutes";

declare global {
  namespace Express {
    interface User {
      id: number,
      name: string,
      email: string,
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    user: Express.User,
    history: {
      conversation: IChatMessage[],
      actions: {action: string, class: string}[],
    },
  }
}

const app = express();

// Security Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "https://cdn.jsdelivr.net", // Allow Bootstrap from jsDelivr
          "https://code.jquery.com", // Allow jQuery from jquery
          "https://cdn.quilljs.com", // Allow Quill.js
        ],
        styleSrc: [
          "'self'",
          "https://cdn.jsdelivr.net", // Allow Bootstrap CSS
          "https://code.jquery.com", // Allow jQuery CSS
          "https://cdn.quilljs.com", // Allow Quill.js CSS
        ],
        fontSrc: ["'self'", "https://cdn.jsdelivr.net"], // Allow fonts
        imgSrc: ["'self'", "data:", "https://code.jquery.com"], // Allow images
        connectSrc: ["'self'"],
        objectSrc: ["'self'"],
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Passport and Session Middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET as string,
    resave: false,
    saveUninitialized: false,
  }),
);
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
  res.locals.user = req.user || null; // Make user available in Pug templates
  next();
});

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// Set view engine
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// Static files
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/", pageRoutes);
app.use("/chat", chatRoutes);
app.use("/auth", authRoutes);
app.use("/booking", bookingRoutes);
app.use("/rfp", rfpRoutes);

// Determine Environment
const isProduction = process.env.NODE_ENV === "production";
let server, PORT, DOMAIN;

if (isProduction) {
  PORT = process.env.PORT || 80;
  DOMAIN = process.env.DOMAIN || "www.rbarati.com";
} else {
  PORT = process.env.PORT || 3000;
  DOMAIN = process.env.DOMAIN || "localhost";
}

// Start HTTP server
server = http
  .createServer(app)
  .listen(PORT, () =>
    console.log(`🚀 Server running on http://${DOMAIN}:${PORT}`),
  );

export default server;

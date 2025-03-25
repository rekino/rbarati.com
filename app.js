const http = require("http");
const express = require("express");
const session = require('express-session');
const passport = require('passport');
const path = require("path");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { Server } = require("socket.io");
require('./config/passport');
require('dotenv').config();

const pageRoutes = require("./routes/pages");
const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

const chatController = require("./controllers/chatController");

const app = express();

// Security Middleware
app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "https://cdn.jsdelivr.net" // Allow Bootstrap from jsDelivr
          ],
          styleSrc: [
            "'self'",
            "https://cdn.jsdelivr.net" // Allow Bootstrap CSS
          ],
          fontSrc: ["'self'", "https://cdn.jsdelivr.net"], // Allow fonts
          imgSrc: ["'self'", "data:"], // Allow images
          connectSrc: ["'self'"],
          objectSrc: ["'none'"]
        }
      }
    })
  );
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Passport and Session Middleware
app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false }));
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
    message: "Too many requests from this IP, please try again later."
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

// Determine Environment
const isProduction = process.env.NODE_ENV === "production";
let server, PORT, DOMAIN;

if(isProduction){
    PORT = process.env.PORT || 80;
    DOMAIN = process.env.DOMAIN || "www.rbarati.com";
} else {
    PORT = process.env.PORT || 3000;
    DOMAIN = process.env.DOMAIN || "localhost";
}

// Start HTTP server
server = http.createServer(app).listen(PORT, () => console.log(`🚀 Server running on http://${DOMAIN}:${PORT}`));

const io = new Server(server);

// WebSocket connection
io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("message", async (msg) => {
        console.log("Received:", msg);
        const response = await chatController.handleChat(msg);
        socket.emit("response", response);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected");
    });
});

module.exports = server;

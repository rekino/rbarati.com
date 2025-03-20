require("dotenv").config();
const fs = require("fs");
const http = require("http");
const https = require("https");
const express = require("express");
const path = require("path");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { Server } = require("socket.io");

const pageRoutes = require("./routes/pages");
const apiRoutes = require("./routes/api");
const chatRoutes = require("./routes/chatRoutes");

const chatController = require("./controllers/chatController")

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP, please try again later."
});
app.use("/api/", limiter);

// Set view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Static files
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/", pageRoutes);
app.use("/api/v1", apiRoutes);
app.use("/chat", chatRoutes);

// Determine Environment
const isProduction = process.env.NODE_ENV === "production";
let server;

if (isProduction) {
    console.log("Running in production mode: Using Let's Encrypt SSL");

    // Load Let's Encrypt Certificates
    const privateKey = fs.readFileSync("/etc/letsencrypt/live/YOUR_DOMAIN/privkey.pem", "utf8");
    const certificate = fs.readFileSync("/etc/letsencrypt/live/YOUR_DOMAIN/cert.pem", "utf8");
    const ca = fs.readFileSync("/etc/letsencrypt/live/YOUR_DOMAIN/chain.pem", "utf8");

    const credentials = { key: privateKey, cert: certificate, ca };

    // Start HTTPS server
    const PORT = process.env.PORT || 443;
    server = https.createServer(credentials, app).listen(PORT, () => {
        console.log(`🚀 Server running on https://yourdomain.com:${PORT}`);
    });

    // Redirect HTTP to HTTPS
    http.createServer((req, res) => {
        res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
        res.end();
    }).listen(80, () => console.log("🔄 Redirecting HTTP to HTTPS"));
} else {
    console.log("Running in development mode:");

    // Start HTTP server
    const PORT = process.env.PORT || 3000;
    server = http.createServer(app).listen(PORT, () => console.log(`🚀 Server running on http://yourdomain.com:${PORT}`));
}

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

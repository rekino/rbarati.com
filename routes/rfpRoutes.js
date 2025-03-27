const express = require("express");
const multer = require("multer");
const path = require("path");

const router = express.Router();

// Set up multer for PDF uploads
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Render the RFP page
router.get("/", (req, res) => {
  res.render("rfp", { title: "Submit an RFP" });
});

// Handle RFP submissions
router.post("/", upload.single("pdfFile"), (req, res) => {
  const { proposalText, proposalLink } = req.body;
  const pdfFile = req.file ? req.file.filename : null;

  // Here you can save the data to your database
  console.log({ proposalText, proposalLink, pdfFile });

  res.send("RFP submitted successfully!");
});

module.exports = router;

import express, { Request, Response } from "express";
import multer from "multer";
import path from "path";

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
router.get("/", (req: Request, res: Response) => {
  res.render("rfp", { title: "Submit an RFP" });
});

// Handle RFP submissions
router.post("/", upload.single("pdfFile"), (req: Request, res: Response) => {
  const { proposalText, proposalLink } = req.body;
  const pdfFile = req.file ? req.file.filename : null;

  // Here you can save the data to your database
  console.log({ proposalText, proposalLink, pdfFile });

  res.redirect("/rfp");
});

export default router;

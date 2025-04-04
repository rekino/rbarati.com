import express, { Request, Response } from "express";
const router = express.Router();

router.get("/", (req: Request, res: Response) => {
  res.render("index", { title: "Home Page" });
});

export default router;

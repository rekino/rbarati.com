import express, { Request, Response } from "express";
const router = express.Router();

router.get("/", (req: Request, res: Response) => {
  res.render("chat", { history: req.session.history });
});

router.get("/history", (req: Request, res: Response) => {
  if(!req.session.history)
    req.session.history = {
      conversation: [{role: "agent", text: "To enhance our service and make your experience even better, we'd like to store your conversations with me. This data helps me train and improve my abilities in the future. Do you agree to the storage and analysis of your chat data?"}],
      actions: `<button class="btn btn-primary">Yes, I agree.</button>
      <button class="btn btn-secondary">No, don't record our conversation.</button>`
    };
  
    res.json(req.session.history);
});

export default router;

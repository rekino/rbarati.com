import express, { Request, Response } from "express";

import { handleChat, retrieveAndRerankExperiences } from "../controllers/chatController";

const router = express.Router();

router.get("/", (req: Request, res: Response) => {
  res.render("chat", { history: req.session.history });
});

router.get("/history", (req: Request, res: Response) => {
  if(!req.session.history)
    req.session.history = {
      conversation: [{role: "assistant", content: "Welcome to Barati Professional Services! My name is Lancelot and I am Ramin's virtual assistant. To enhance our service and make your experience even better, we'd like to store your conversations with me. This data helps me train and improve my abilities in the future. Do you agree to the storage and analysis of your chat data?"}],
      actions: [
        {action: "Yes, I agree.", class: "btn btn-primary"},
        {action: "No, don't record our conversation.", class: "btn btn-secondary"},
      ],
    };
  
  res.json(req.session.history);
});

router.post("/history", async (req: Request, res: Response) => {
  if(!req.session.history) {
    res.status(500).json({ error: "no history for this session" });
    return;
  }

  const { message } = req.body;

  if(!message) {
    res.status(400).json({ error: 'missing parameters' });
    return;
  }
  if (typeof message !== 'string') {
    res.status(400).json({ error: 'invalid parameters' });
    return;
  }

  let history = req.session.history;
  let reply: string, actions: {action: string, class: string}[];

  if(history.conversation.length === 1) {
    if (!["Yes, I agree.", "No, don't record our conversation."].includes(message)) {
      res.status(400).json({ error: 'invalid message' });
      return;
    }

    reply = "I'm instructed to answer questions about Ramin based on available information. However, I might occasionally make mistakes or miss important details. Always verify my responses with Ramin's official CV to ensure accuracy, especially when it comes to skills, experience, or qualifications.";
    actions = [{action: "I understand.", class: "btn btn-primary"}];
  } else if (history.conversation.length === 3) {
    if (!["I understand."].includes(message)) {
      res.status(400).json({ error: 'invalid message' });
      return;
    }

    reply = "Great! How can we be of help?";
    actions = [];
  } else {
    const experiences = await retrieveAndRerankExperiences(message);
    reply = await handleChat(experiences, history.conversation, message);
    actions = [];
  }

  history.conversation.push({ role: "user", content: message });
  history.conversation.push({ role: "assistant", content: reply });
  history.actions = actions;

  res.json({
    message: reply,
    actions: actions,
  });
});

router.delete("/history", (req: Request, res: Response) => {
  req.session.history = {
    conversation: [{role: "assistant", content: "Welcome to Barati Professional Services! My name is Lancelot and I am Ramin's virtual assistant. To enhance our service and make your experience even better, we'd like to store your conversations with me. This data helps me train and improve my abilities in the future. Do you agree to the storage and analysis of your chat data?"}],
    actions: [
      {action: "Yes, I agree.", class: "btn btn-primary"},
      {action: "No, don't record our conversation.", class: "btn btn-secondary"},
    ],
  };

  res.json("OK");
});

export default router;

import express, { Request, Response } from "express";

import { handleChat } from "../controllers/chatController";

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
    reply = await handleChat([
      "from 2023 to 2025, Ramin was a Technical Lead at Paya co., Tehran, Iran. He lead a team of data scientists and software developers in conception, design and development of ML-oriented solutions, covering vision, speech and NLP. The project resulted in setting up an automated pipeline for packaging machine learning models that are ready for deployment on public or private clouds using Nvidia Triton.",
      "from 2021 to 2022, Ramin was a Data Engineer at CarNext.com, Remote. He developed Scala applications to parse Kafka topics from Confluence cloud and feature them in the delta lake format using Spark for a datamesh solution on Amazon S3.",
      "from 2017 to 2020, Ramin was an Algorithm Engineer at Mahan Airlines, Tehran, Iran. He modeled and solved flight planning and crew assignment optimization problems using MIP and CSP, developed a Python/NodeJS software solution to enable human-machine collaboration in overcoming operational issues which decreased the planning time by 3 folds, and supervised new developers and instructed them in coding conventions and standards.",
    ], history.conversation, message);
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

export default router;

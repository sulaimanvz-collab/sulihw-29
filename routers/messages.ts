import express from "express";
import { promises as fs } from "fs";
import path from "path";

const messagesRouter = express.Router();
const messagesDir = path.join(__dirname, "../messages");

interface MessageBody {
  message: string;
}

interface SavedMessage extends MessageBody {
  datetime: string;
}

const ensureDirectoryExists = async () => {
  try {
    await fs.access(messagesDir);
  } catch {
    await fs.mkdir(messagesDir, { recursive: true });
  }
};

messagesRouter.post("/", async (req, res) => {
  try {
    await ensureDirectoryExists();
    const { message } = req.body as MessageBody;

    if (!message || typeof message !== "string") {
      res.status(400).send({ error: 'Field "message" is required' });
      return;
    }

    const datetime = new Date().toISOString();
    const messageToSave: SavedMessage = { message, datetime };

    const fileName = `${datetime}.txt`;
    const filePath = path.join(messagesDir, fileName);

    await fs.writeFile(filePath, JSON.stringify(messageToSave, null, 2));
    res.send(messageToSave);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Server error" });
  }
});

export default messagesRouter;

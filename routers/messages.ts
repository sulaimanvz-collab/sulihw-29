import express from "express";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const messagesRouter = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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
      res
        .status(400)
        .send({ error: 'Field "message" is required and must be a string.' });
      return;
    }

    const datetime = new Date().toISOString();

    const messageToSave: SavedMessage = { message, datetime };

    const fileName = `${datetime}.txt`.replace(/:/g, "-");
    const filePath = path.join(messagesDir, fileName);

    await fs.writeFile(filePath, JSON.stringify(messageToSave, null, 2));

    res.send(messageToSave);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Server error while saving message." });
  }
});

messagesRouter.get("/", async (req, res) => {
  try {
    await ensureDirectoryExists();

    const files = await fs.readdir(messagesDir);

    const lastFiveFiles = files.sort().slice(-5);

    const result: SavedMessage[] = [];

    for (const file of lastFiveFiles) {
      const filePath = path.join(messagesDir, file);
      const fileContents = await fs.readFile(filePath, "utf-8");

      const parsedMessage = JSON.parse(fileContents) as SavedMessage;
      result.push(parsedMessage);
    }

    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Server error while fetching messages." });
  }
});

export default messagesRouter;

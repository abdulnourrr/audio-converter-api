import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import fetch from "node-fetch";
import { tmpdir } from "os";
import path from "path";

export const config = {
  api: { bodyParser: { sizeLimit: "50mb" } },
};

export default async function handler(req, res) {
  try {
    const { url, format } = req.body;
    if (!url || !format)
      return res.status(400).json({ error: "Missing parameters: url or format" });

    const inputPath = path.join(tmpdir(), "input.opus");
    const outputPath = path.join(tmpdir(), `output.${format}`);

    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(inputPath, Buffer.from(buffer));

    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat(format)
        .on("end", resolve)
        .on("error", reject)
        .save(outputPath);
    });

    const file = fs.readFileSync(outputPath);
    res.setHeader("Content-Type", `audio/${format}`);
    res.send(file);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

import { createFFmpeg, fetchFile } from "@ffmpeg.wasm/main";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { url, format } = req.body;
    if (!url || !format) {
      return res.status(400).json({ error: "Missing parameters: url or format" });
    }

    // Load ffmpeg.wasm
    const ffmpeg = createFFmpeg({ log: false });
    if (!ffmpeg.isLoaded()) await ffmpeg.load();

    // Fetch the input audio file
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();

    // Write file to ffmpeg virtual FS
    ffmpeg.FS("writeFile", "input", new Uint8Array(arrayBuffer));

    // Convert using ffmpeg
    await ffmpeg.run("-i", "input", `output.${format}`);

    // Read converted output
    const data = ffmpeg.FS("readFile", `output.${format}`);

    // Send result
    res.setHeader("Content-Type", `audio/${format}`);
    res.status(200).send(Buffer.from(data));

  } catch (error) {
    console.error("Conversion error:", error);
    res.status(500).json({ error: error.message });
  }
}

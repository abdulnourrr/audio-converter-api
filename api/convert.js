import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url, format } = req.body;

    if (!url || !format) {
      return res.status(400).json({ error: 'Missing parameters: url or format' });
    }

    const ffmpeg = createFFmpeg({ log: false });
    await ffmpeg.load();

    // Fetch the file from Google Drive or a remote source
    const response = await fetch(url);
    const buffer = Buffer.from(await response.arrayBuffer());

    ffmpeg.FS('writeFile', `input.opus`, new Uint8Array(buffer));

    await ffmpeg.run('-i', 'input.opus', `output.${format}`);

    const data = ffmpeg.FS('readFile', `output.${format}`);

    res.setHeader('Content-Type', `audio/${format}`);
    res.send(Buffer.from(data));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

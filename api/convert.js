import { createFFmpeg } from '@ffmpeg/ffmpeg';
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

    const ffmpeg = createFFmpeg({ log: true });
    await ffmpeg.load();

    const response = await fetch(url);
    if (!response.ok) {
      return res.status(400).json({ error: 'Failed to fetch file' });
    }

    const data = new Uint8Array(await response.arrayBuffer());
    ffmpeg.FS('writeFile', 'input.opus', data);

    const outputFile = `output.${format}`;
    await ffmpeg.run('-i', 'input.opus', '-acodec', 'libmp3lame', outputFile);

    const output = ffmpeg.FS('readFile', outputFile);

    res.setHeader('Content-Type', `audio/${format}`);
    res.send(Buffer.from(output));
  } catch (err) {
    console.error('Conversion error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

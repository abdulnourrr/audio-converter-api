import { createFFmpeg } from '@ffmpeg/ffmpeg';
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url, format } = req.body || {};
    if (!url || !format) {
      return res.status(400).json({ error: 'Missing parameters: url or format' });
    }

    // Load ffmpeg (single-threaded build)
    const ffmpeg = createFFmpeg({ log: false });
    await ffmpeg.load();
    // Small settle delay helps in serverless envs
    await new Promise(r => setTimeout(r, 300));

    // Fetch remote OPUS (or any) file
    const resp = await fetch(url);
    if (!resp.ok) {
      return res.status(400).json({ error: `Failed to fetch source: ${resp.status} ${resp.statusText}` });
    }
    const buf = Buffer.from(await resp.arrayBuffer());

    // Guess an input name/extension; WhatsApp is usually .opus
    const inputName = 'input.opus';
    const outputName = `output.${format}`;

    ffmpeg.FS('writeFile', inputName, new Uint8Array(buf));

    // Convert → MP3 by default, explicitly set codec
    // For mp3: libmp3lame; for m4a: aac; for wav: pcm_s16le
    const args =
      format === 'mp3'
        ? ['-i', inputName, '-acodec', 'libmp3lame', outputName]
        : ['-i', inputName, outputName];

    await ffmpeg.run(...args);

    const data = ffmpeg.FS('readFile', outputName);

    res.setHeader('Content-Type', `audio/${format}`);
    res.status(200).send(Buffer.from(data));
  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({ error: String(error?.message || error) });
  }
}

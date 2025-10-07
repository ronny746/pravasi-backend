const express = require('express');
const bodyParser = require('body-parser');
const googleTTS = require('google-tts-api');
const fs = require('fs');
const https = require('https');
const path = require('path');
const { exec } = require('child_process');

const app = express();
app.use(bodyParser.json());

// Serve audio/video files
app.use('/media', express.static(path.join(__dirname, 'media')));

if (!fs.existsSync('media')) fs.mkdirSync('media');

// Split text into chunks (~200 chars)
function splitText(text, maxLength = 200) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = start + maxLength;
    if (end < text.length) {
      while (text[end] !== ' ' && end > start) end--;
    }
    chunks.push(text.slice(start, end).trim());
    start = end + 1;
  }
  return chunks;
}

// Download single TTS chunk
function downloadChunk(url, filePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', (err) => {
      fs.unlinkSync(filePath);
      reject(err);
    });
  });
}

// ---------------- AUDIO ROUTE ----------------
app.post('/tts-link', async (req, res) => {
  const { text, lang = 'en', speed = 1 } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });

  try {
    const chunks = splitText(text, 200);
    const chunkFiles = [];

    for (let i = 0; i < chunks.length; i++) {
      const url = googleTTS.getAudioUrl(chunks[i], { lang, slow: speed < 1 });
      const filePath = path.join('media', `chunk_${Date.now()}_${i}.mp3`);
      await downloadChunk(url, filePath);
      chunkFiles.push(filePath);
    }

    const listFile = path.join('media', `files_${Date.now()}.txt`);
    fs.writeFileSync(listFile, chunkFiles.map(f => `file '${path.resolve(f)}'`).join('\n'));

    const outputFile = path.join('media', `audio_${Date.now()}.mp3`);
    exec(`ffmpeg -y -f concat -safe 0 -i ${listFile} -c copy ${outputFile}`, (err) => {
      chunkFiles.forEach(f => fs.unlinkSync(f));
      fs.unlinkSync(listFile);

      if (err) return res.status(500).json({ error: 'Audio merge failed', details: err.message });

      const audioUrl = `${req.protocol}://${req.get('host')}/media/${path.basename(outputFile)}`;
      res.json({ message: 'Audio generated successfully', audioUrl, downloadLink: audioUrl });
    });

  } catch (err) {
    res.status(500).json({ error: 'TTS generation failed', details: err.message });
  }
});

// ---------------- VIDEO ROUTE ----------------
app.post('/tts-video', async (req, res) => {
  const { text, lang = 'en', speed = 1, image = 'http://31.97.231.85:2700/images/IMG-1759734185847-541035489.jpg' } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });
  if (!fs.existsSync(image)) return res.status(400).json({ error: 'Cover image not found' });

  try {
    const chunks = splitText(text, 200);
    const chunkFiles = [];

    for (let i = 0; i < chunks.length; i++) {
      const url = googleTTS.getAudioUrl(chunks[i], { lang, slow: speed < 1 });
      const filePath = path.join('media', `chunk_${Date.now()}_${i}.mp3`);
      await downloadChunk(url, filePath);
      chunkFiles.push(filePath);
    }

    const listFile = path.join('media', `files_${Date.now()}.txt`);
    fs.writeFileSync(listFile, chunkFiles.map(f => `file '${path.resolve(f)}'`).join('\n'));

    const audioFile = path.join('media', `audio_${Date.now()}.mp3`);
    exec(`ffmpeg -y -f concat -safe 0 -i ${listFile} -c copy ${audioFile}`, (err) => {
      chunkFiles.forEach(f => fs.unlinkSync(f));
      fs.unlinkSync(listFile);

      if (err) return res.status(500).json({ error: 'Audio merge failed', details: err.message });

      const videoFile = path.join('media', `video_${Date.now()}.mp4`);
      exec(`ffmpeg -y -loop 1 -i ${image} -i ${audioFile} -c:v libx264 -c:a aac -b:a 192k -shortest ${videoFile}`, (err2) => {
        fs.unlinkSync(audioFile);
        if (err2) return res.status(500).json({ error: 'Video generation failed', details: err2.message });

        const videoUrl = `${req.protocol}://${req.get('host')}/media/${path.basename(videoFile)}`;
        res.json({ message: 'Video generated successfully', videoUrl, downloadLink: videoUrl });
      });
    });

  } catch (err) {
    res.status(500).json({ error: 'TTS video generation failed', details: err.message });
  }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));

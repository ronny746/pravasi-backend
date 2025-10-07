const googleTTS = require('google-tts-api');
const fs = require('fs');
const https = require('https');
const path = require('path');
const { exec } = require('child_process');

// Split long text
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

// Download a single audio chunk
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


exports.generateAudio = async (req, res) => {
  const { text, lang = 'en', speed = 1 } = req.body;

  if (!text) return res.status(400).json({ error: 'Text is required' });

  try {
    const url = googleTTS.getAudioUrl(text, {
      lang,
      slow: speed < 1,
      host: 'https://translate.google.com',
    });

    const fileName = `audio_${Date.now()}.mp3`;
    const filePath = path.join(__dirname, '../media', fileName);
    const file = fs.createWriteStream(filePath);

    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        const fileUrl = `${req.protocol}://${req.get('host')}/media/${fileName}`;
        res.json({
          message: 'Audio generated successfully',
          play_url: fileUrl,
          download_url: fileUrl,
        });
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'TTS generation failed' });
  }
};


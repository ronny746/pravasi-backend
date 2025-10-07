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

// Generate TTS Audio
exports.generateAudio = async (req, res) => {
  const { text, lang = 'en', speed = 1 } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });

  try {
    if (!fs.existsSync('media')) fs.mkdirSync('media');
    const chunks = splitText(text, 200);
    const chunkFiles = [];

    // Download all chunks
    for (let i = 0; i < chunks.length; i++) {
      const url = googleTTS.getAudioUrl(chunks[i], { lang, slow: speed < 1 });
      const filePath = path.join('media', `chunk_${Date.now()}_${i}.mp3`);
      await downloadChunk(url, filePath);
      chunkFiles.push(filePath);
    }

    // Merge all chunks
    const listFile = path.join('media', `files_${Date.now()}.txt`);
    fs.writeFileSync(listFile, chunkFiles.map(f => `file '${path.resolve(f)}'`).join('\n'));

    const outputFile = path.join('media', `audio_${Date.now()}.mp3`);
    exec(`ffmpeg -y -f concat -safe 0 -i ${listFile} -c copy ${outputFile}`, (err) => {
      chunkFiles.forEach(f => fs.unlinkSync(f));
      fs.unlinkSync(listFile);

      if (err) return res.status(500).json({ error: 'Audio merge failed', details: err.message });

      const audioUrl = `${req.protocol}://${req.get('host')}/media/${path.basename(outputFile)}`;
      res.json({
        message: 'Audio generated successfully',
        audioUrl,
        downloadLink: audioUrl
      });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'TTS generation failed', details: err.message });
  }
};

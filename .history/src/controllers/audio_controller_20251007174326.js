const googleTTS = require('google-tts-api');
const fs = require('fs');
const https = require('https');
const path = require('path');
const { exec } = require('child_process');

// Split long text into chunks (Google TTS limit ~200 chars)
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

// Download one chunk
function downloadChunk(url, filePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    https
      .get(url, (res) => {
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
      })
      .on('error', (err) => {
        fs.existsSync(filePath) && fs.unlinkSync(filePath);
        reject(err);
      });
  });
}

// Generate Audio Controller
exports.generateAudio = async (req, res) => {
  const { text, lang = 'en', speed = 1 } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });

  try {
    // ✅ Ensure media folder exists inside src/
    const mediaDir = path.join(__dirname, '../media');
    if (!fs.existsSync(mediaDir)) {
      fs.mkdirSync(mediaDir, { recursive: true });
    }

    // Split text and prepare chunks
    const chunks = splitText(text, 200);
    const chunkFiles = [];

    // Download each audio chunk
    for (let i = 0; i < chunks.length; i++) {
      const url = googleTTS.getAudioUrl(chunks[i], { lang, slow: false });
      const filePath = path.join(mediaDir, `chunk_${Date.now()}_${i}.mp3`);
      await downloadChunk(url, filePath);
      chunkFiles.push(filePath);
    }

    // Create ffmpeg file list
    const listFile = path.join(mediaDir, `files_${Date.now()}.txt`);
    fs.writeFileSync(listFile, chunkFiles.map(f => `file '${path.resolve(f)}'`).join('\n'));

    // Output final audio path
    const outputFile = path.join(mediaDir, `audio_${Date.now()}.mp3`);

    // Merge chunks safely
    exec(`ffmpeg -y -f concat -safe 0 -i "${listFile}" -c copy "${outputFile}"`, (err) => {
      // Cleanup temp chunks & list
      chunkFiles.forEach(f => fs.existsSync(f) && fs.unlinkSync(f));
      fs.existsSync(listFile) && fs.unlinkSync(listFile);

      if (err) {
        console.error('FFmpeg merge error:', err);
        return res.status(500).json({ error: 'Audio merge failed', details: err.message });
      }

      const audioUrl = `${req.protocol}://${req.get('host')}/media/${path.basename(outputFile)}`;
      res.json({
        message: '✅ Audio generated successfully',
        play_url: audioUrl,
        download_link: audioUrl
      });
    });
  } catch (err) {
    console.error('TTS generation failed:', err);
    res.status(500).json({ error: 'TTS generation failed', details: err.message });
  }
};

const googleTTS = require('google-tts-api'); // existing
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

function splitText(text, maxLength) {
  // Your existing split logic
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    chunks.push(text.substring(start, start + maxLength));
    start += maxLength;
  }
  return chunks;
}

function downloadChunk(url, filePath) {
  return new Promise((resolve, reject) => {
    const https = require('https');
    const file = fs.createWriteStream(filePath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', reject);
  });
}

exports.generateAudio = async (req, res) => {
  const { text, lang = 'en', speed = 1 } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });

  try {
    const mediaDir = path.join(__dirname, '../media');
    if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });

    const chunks = splitText(text, 200);
    const chunkFiles = [];

    for (let i = 0; i < chunks.length; i++) {
      // ✅ Added slow=false to keep male-ish voice clear
      const url = googleTTS.getAudioUrl(chunks[i], { lang, slow: false });
      const filePath = path.join(mediaDir, `chunk_${Date.now()}_${i}.mp3`);
      await downloadChunk(url, filePath);
      chunkFiles.push(filePath);
    }

    const listFile = path.join(mediaDir, `files_${Date.now()}.txt`);
    fs.writeFileSync(listFile, chunkFiles.map(f => `file '${path.resolve(f)}'`).join('\n'));

    const outputFile = path.join(mediaDir, `audio_${Date.now()}.mp3`);

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
        message: '✅ Male-ish Audio generated successfully',
        play_url: audioUrl,
        download_link: audioUrl
      });
    });
  } catch (err) {
    console.error('TTS generation failed:', err);
    res.status(500).json({ error: 'TTS generation failed', details: err.message });
  }
};

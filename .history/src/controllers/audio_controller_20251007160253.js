const googleTTS = require('google-tts-api');
const fs = require('fs');
const https = require('https');
const path = require('path');
const { exec } = require('child_process');

/**
 * 🔹 Split long text into smaller chunks (Google TTS has ~200 char limit)
 */
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

/**
 * 🔹 Download single TTS chunk from Google
 */
function downloadChunk(url, filePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    https
      .get(url, (response) => {
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      })
      .on('error', (err) => {
        fs.unlinkSync(filePath);
        reject(err);
      });
  });
}

/**
 * 🔹 Generate full audio file (supports long paragraphs)
 */
exports.generateAudio = async (req, res) => {
  const { text, lang = 'en', speed = 1 } = req.body;

  if (!text) return res.status(400).json({ error: 'Text is required' });

  try {
    const chunks = splitText(text);
    const tempFiles = [];

    // 1️⃣ Generate and download each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const url = googleTTS.getAudioUrl(chunk, {
        lang,
        slow: speed < 1,
        host: 'https://translate.google.com',
      });

      const chunkPath = path.join(__dirname, `../media/temp_${Date.now()}_${i}.mp3`);
      await downloadChunk(url, chunkPath);
      tempFiles.push(chunkPath);
    }

    // 2️⃣ Merge all chunks into one final file (requires ffmpeg)
    const outputFileName = `audio_${Date.now()}.mp3`;
    const outputPath = path.join(__dirname, `../media/${outputFileName}`);
    const fileListPath = path.join(__dirname, '../media/filelist.txt');

    // Create file list for ffmpeg
    fs.writeFileSync(fileListPath, tempFiles.map((f) => `file '${f}'`).join('\n'));

    exec(`ffmpeg -y -f concat -safe 0 -i "${fileListPath}" -c copy "${outputPath}"`, (err) => {
      // Cleanup temp files
      tempFiles.forEach((f) => fs.existsSync(f) && fs.unlinkSync(f));
      fs.existsSync(fileListPath) && fs.unlinkSync(fileListPath);

      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Audio merge failed' });
      }

      const fileUrl = `${req.protocol}://${req.get('host')}/media/${outputFileName}`;
      res.json({
        message: '✅ Audio generated successfully',
        play_url: fileUrl,
        download_url: fileUrl,
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'TTS generation failed' });
  }
};

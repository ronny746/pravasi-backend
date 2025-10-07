const express = require('express');
const bodyParser = require('body-parser');
const googleTTS = require('google-tts-api');
const fs = require('fs');
const https = require('https');
const { exec } = require('child_process');
const path = require('path');

const app = express();
app.use(bodyParser.json());

// Function to split text into ~200 char chunks
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
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlinkSync(filePath);
            reject(err);
        });
    });
}

app.post('/tts', async (req, res) => {
    const { text, lang = 'en', speed = 1 } = req.body;

    if (!text) return res.status(400).json({ error: 'Text is required' });

    try {
        const chunks = splitText(text, 200);
        const chunkFiles = [];

        // Generate TTS for each chunk
        for (let i = 0; i < chunks.length; i++) {
            const url = googleTTS.getAudioUrl(chunks[i], { lang, slow: speed < 1 });
            const filePath = `chunk_${i}.mp3`;
            await downloadChunk(url, filePath);
            chunkFiles.push(filePath);
        }

        // Merge audio files using ffmpeg
        const listFile = 'files.txt';
        fs.writeFileSync(listFile, chunkFiles.map(f => `file '${path.resolve(f)}'`).join('\n'));

        const outputFile = 'output.mp3';
        exec(`ffmpeg -y -f concat -safe 0 -i ${listFile} -c copy ${outputFile}`, (err) => {
            // Cleanup chunk files and list
            chunkFiles.forEach(f => fs.unlinkSync(f));
            fs.unlinkSync(listFile);

            if (err) return res.status(500).json({ error: 'Audio merge failed', details: err.message });

            // Send final MP3
            res.download(outputFile, 'audio.mp3', (err) => {
                if (err) console.log(err);
                fs.unlinkSync(outputFile);
            });
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'TTS generation failed', details: err.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`TTS API running on http://localhost:${PORT}`);
});

const express = require('express');
const bodyParser = require('body-parser');
const googleTTS = require('google-tts-api'); // Free TTS API
const fs = require('fs');
const https = require('https');

const app = express();
app.use(bodyParser.json());

app.post('/tts', async (req, res) => {
    const { text, lang = 'en', speed = 1 } = req.body;

    if (!text) return res.status(400).json({ error: 'Text is required' });

    try {
        // Generate Google TTS URL
        const url = googleTTS.getAudioUrl(text, {
            lang,
            slow: speed < 1,
            host: 'https://translate.google.com',
        });

        // Download audio and return as MP3
        const filePath = 'output.mp3';
        const file = fs.createWriteStream(filePath);

        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                res.download(filePath, 'audio.mp3', (err) => {
                    if (err) console.log(err);
                    fs.unlinkSync(filePath); // delete after sending
                });
            });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'TTS generation failed' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`TTS API running on http://localhost:${PORT}`);
});

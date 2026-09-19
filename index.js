const { GoogleGenAI } = require('@google/genai');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Gemini API istemcisini başlatma (API anahtarını Render Environment Variables kısmından alacak)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Botun ana soru-cevap uç noktası (Endpoint)
app.post('/ask', async (req, res) => {
    try {
        const userQuestion = req.body.question;
        if (!userQuestion) {
            return res.status(400).json({ error: 'Lütfen bir soru belirtin.' });
        }

        // Gemini modelini çağırarak oyuncunun sorusuna yanıt üretme
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userQuestion,
        });

        res.json({ answer: response.text });
    } catch (error) {
        console.error('Hata oluştu:', error);
        res.status(500).json({ error: 'Yapay zeka yanıt üretirken bir hata oluştu.' });
    }
});

// Render'ın ayakta tutması için basit bir ana sayfa kontrolü
app.get('/', (req, res) => {
    sendResponse = 'Cubixora Yapay Zeka Botu aktif ve çalışıyor!';
    res.send(sendResponse);
});

app.listen(port, () => {
    console.log(`Sunucu ${port} portunda çalışıyor.`);
});

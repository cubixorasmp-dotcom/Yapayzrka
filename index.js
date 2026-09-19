const { Client, GatewayIntentBits } = require('discord.js');
const { GoogleGenAI } = require('@google/genai');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent 
    ] 
});

// API anahtarını doğrudan çevre değişkeninden alıyoruz
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

client.once('ready', () => {
    console.log(`Bot ${client.user.tag} olarak giriş yaptı! 🤖`);
});

client.on('messageCreate', async message => {
    // Botun kendi mesajlarını yoksay
    if (message.author.bot) return;
    
    // Sadece 'yapayzeka-ai' adlı kanaldaki mesajları dinle
    if (message.channel.name !== 'yapayzeka-ai') return;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: message.content,
        });

        if (response && response.text) {
            await message.reply(response.text);
        } else {
            await message.reply('Yapay zeka bir yanıt üretemedi.');
        }
    } catch (error) {
        console.error('Gemini API Hatası:', error);
        await message.reply('Bir hata oluştu.');
    }
});

client.login(process.env.DISCORD_TOKEN);

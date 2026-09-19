const { Client, GatewayIntentBits } = require('discord.js');
const { GoogleGenAI } = require('@google/genai');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent 
    ] 
});

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

client.once('ready', () => {
    console.log(`Bot ${client.user.tag} olarak giriş yaptı! 🤖`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    
    if (message.content.startsWith('!sor')) {
        const prompt = message.content.slice(5);
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: prompt,
            });
            message.reply(response.text);
        } catch (error) {
            console.error(error);
            message.reply('Bir hata oluştu.');
        }
    }
});

client.login(process.env.DISCORD_TOKEN);

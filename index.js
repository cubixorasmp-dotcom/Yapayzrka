const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent 
    ] 
});

// Eski SDK yerine kararlı GoogleGenerativeAI başlatması
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
let aktifKanalId = null;

client.once('ready', async () => {
    console.log(`Bot ${client.user.tag} olarak giriş yaptı! 🤖`);

    const commands = [
        new SlashCommandBuilder()
            .setName('yapay-kanal')
            .setDescription('Yapay zekanın çalışacağı aktif kanalı belirler.')
            .addChannelOption(option => 
                option.setName('kanal')
                    .setDescription('Yapay zeka kanalını seçin')
                    .setRequired(true)
            )
    ].map(command => command.toJSON());

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );
        console.log('Slash komutları başarıyla kaydedildi!');
    } catch (error) {
        console.error('Komut kaydetme hatası:', error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'yapay-kanal') {
        const secilenKanal = interaction.options.getChannel('kanal');
        aktifKanalId = secilenKanal.id;

        await interaction.reply(`✅ Yapay zeka aktif kanalı başarıyla <#${aktifKanalId}> olarak ayarlandı!`);
    }
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (!aktifKanalId || message.channel.id !== aktifKanalId) return;

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(message.content);
        const response = await result.response;
        const text = response.text();

        if (text) {
            await message.reply(text);
        } else {
            await message.reply('Yapay zeka bir yanıt üretemedi.');
        }
    } catch (error) {
        console.error('Gemini API Hatası:', error);
        await message.reply('Bir hata oluştu.');
    }
});

client.login(process.env.DISCORD_TOKEN);

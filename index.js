const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
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

// Aktif kanal ID'sini tutacağımız değişken
let aktifKanalId = null;

client.once('ready', async () => {
    console.log(`Bot ${client.user.tag} olarak giriş yaptı! 🤖`);

    // Slash komutunu Discord'a kaydetme (Guild bazlı hızlı kayıt)
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
        console.log('Slash komutları yenileniyor...');
        // Tüm sunucularda anında aktif olması için global kayıt (veya guild içi kayıt yapabilirsiniz)
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );
        console.log('Slash komutları başarıyla kaydedildi!');
    } catch (error) {
        console.error('Komut kaydetme hatası:', error);
    }
});

// Slash komutu çalıştırıldığında
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'yapay-kanal') {
        // Komutu kullanan kişinin yetkisi var mı kontrol edebilirsin (isteğe bağlı)
        const secilenKanal = interaction.options.getChannel('kanal');
        aktifKanalId = secilenKanal.id;

        await interaction.reply(`✅ Yapay zeka aktif kanalı başarıyla <#${aktifKanalId}> olarak ayarlandı!`);
    }
});

// Mesajları dinleme ve Gemini'a gönderme
client.on('messageCreate', async message => {
    if (message.author.bot) return;
    
    // Eğer aktif bir kanal seçilmediyse veya mesaj gelen kanal aktif kanal değilse yoksay
    if (!aktifKanalId || message.channel.id !== aktifKanalId) return;

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

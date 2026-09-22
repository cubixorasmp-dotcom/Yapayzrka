import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, ChannelType } from "discord.js";
import { GoogleGenAI } from "@google/genai";
import { createServer } from "node:http";

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;

if (!DISCORD_TOKEN) throw new Error("DISCORD_TOKEN ortam değişkeni eksik.");
if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY ortam değişkeni eksik.");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const aktifKanallar = new Map();

const yapayKanalKomutu = new SlashCommandBuilder()
  .setName("yapay-kanal")
  .setDescription("Gemini yapay zekanın cevap vereceği kanalı seçer.")
  .addChannelOption(option =>
    option
      .setName("kanal")
      .setDescription("Yapay zekanın cevap vereceği Discord kanalı")
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)
  );

async function komutuKaydet() {
  const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);
  const route = DISCORD_GUILD_ID
    ? Routes.applicationGuildCommands(client.user.id, DISCORD_GUILD_ID)
    : Routes.applicationCommands(client.user.id);

  await rest.put(route, { body: [yapayKanalKomutu.toJSON()] });
  console.log(DISCORD_GUILD_ID ? "Sunucu slash komutu kaydedildi." : "Global slash komutu kaydedildi.");
}

function parcalaraAyir(text, limit = 2000) {
  const parcalar = [];
  for (let i = 0; i < text.length; i += limit) {
    parcalar.push(text.slice(i, i + limit));
  }
  return parcalar;
}

client.once("ready", async () => {
  console.log(client.user.tag + " olarak giriş yapıldı.");
  try {
    await komutuKaydet();
  } catch (error) {
    console.error("Slash komutu kaydedilemedi:", error);
  }
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== "yapay-kanal") return;

  const kanal = interaction.options.getChannel("kanal", true);
  aktifKanallar.set(interaction.guildId, kanal.id);

  await interaction.reply({
    content: "✅ Yapay zeka kanalı " + kanal.toString() + " olarak seçildi. Artık sorularına burada cevap vereceğim.",
    ephemeral: false
  });
});

client.on("messageCreate", async message => {
  if (message.author.bot || !message.guild) return;
  if (aktifKanallar.get(message.guild.id) !== message.channel.id) return;
  if (!message.content.trim()) return;

  try {
    await message.channel.sendTyping();
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: message.content
    });
    const cevap = response.text?.trim();

    if (!cevap) {
      await message.reply("Gemini şu anda boş cevap döndürdü.");
      return;
    }

    for (const parca of parcalaraAyir(cevap)) {
      await message.channel.send(parca);
    }
  } catch (error) {
    console.error("Gemini hatası:", error);
    await message.reply("Yapay zeka cevap verirken bir hata oluştu. Render ortam değişkenlerini ve Gemini modelini kontrol et.");
  }
});

if (process.env.PORT) {
  const server = createServer((request, response) => {
    if (request.url === "/health") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ status: "ok", bot: client.isReady() }));
      return;
    }
    response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Yapay bot aktif");
  });

  server.listen(process.env.PORT, "0.0.0.0", () => {
    console.log("Health server " + process.env.PORT + " portunda çalışıyor.");
  });
}

client.login(DISCORD_TOKEN);

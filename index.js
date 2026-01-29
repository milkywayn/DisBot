const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once("ready", () => {
  console.log(`Bot logged in as ${client.user.tag}`);
});

client.on("messageCreate", async message => {
  if (message.author.bot) return;

  // !guild GuildName
  if (message.content.startsWith("!guild")) {
    const args = message.content.split(" ").slice(1);
    if (!args.length) {
      return message.reply("ギルド名を指定してね 👉 `!guild GuildName`");
    }

    const guildName = args.join(" ");

    try {
      const url = `https://api.wynncraft.com/v3/guild/${encodeURIComponent(guildName)}`;
      const res = await axios.get(url);
      const g = res.data;

      const online = Object.values(g.members).flatMap(rank =>
        rank.filter(m => m.online)
      ).length;

      const total = Object.values(g.members).flat().length;

      message.reply(
        `🏰 **${g.name} [${g.prefix}]**\n` +
        `📈 Level: ${g.level}\n` +
        `⭐ XP: ${g.xp.toLocaleString()}\n` +
        `👥 Members: ${total}\n` +
        `🟢 Online: ${online}`
      );

    } catch (err) {
      message.reply("❌ ギルドが見つからない or APIエラー");
    }
  }
});

client.login(process.env.TOKEN);
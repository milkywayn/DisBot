const { Client, GatewayIntentBits, Events } = require("discord.js");
const axios = require("axios");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once(Events.ClientReady, (c) => {
  console.log(`Bot logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "guild") {
    const guildName = interaction.options.getString("name");

    // Discord に「考え中です…」と最初に返す
    await interaction.deferReply();

    try {
      const url = `https://api.wynncraft.com/v3/guild/${encodeURIComponent(guildName)}`;
      const res = await axios.get(url);
      const g = res.data;

      // ギルドが存在しない場合
      if (!g || !g.members) {
        return await interaction.editReply("❌ ギルドが見つかりません");
      }

      // メンバー情報を安全に取得
      const allMembers = Object.values(g.members).flatMap(rank => Array.isArray(rank) ? rank : []);
      const total = allMembers.length;
      const online = allMembers.filter(m => m.online).length;

      await interaction.editReply(
        `🏰 **${g.name} [${g.prefix}]**\n` +
        `📈 Level: ${g.level}\n` +
        `⭐ XP: ${g.xp.toLocaleString()}\n` +
        `👥 Members: ${total}\n` +
        `🟢 Online: ${online}`
      );

    } catch (err) {
      console.error("Wynncraft API error:", err.message || err);
      await interaction.editReply("❌ ギルドが見つからない or APIエラー");
    }
  }
});

client.login(process.env.TOKEN);

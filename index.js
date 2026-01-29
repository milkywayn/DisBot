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

    // ★ ここが超重要
    await interaction.deferReply();

    try {
      const url = `https://api.wynncraft.com/v3/guild/${encodeURIComponent(guildName)}`;
      const res = await axios.get(url);
      const g = res.data;

      const online = Object.values(g.members)
        .flatMap(rank => rank)
        .filter(m => m.online).length;

      const total = Object.values(g.members)
        .flat().length;

      await interaction.editReply(
        `🏰 **${g.name} [${g.prefix}]**\n` +
        `📈 Level: ${g.level}\n` +
        `⭐ XP: ${g.xp.toLocaleString()}\n` +
        `👥 Members: ${total}\n` +
        `🟢 Online: ${online}`
      );

    } catch (err) {
      console.error(err);
      await interaction.editReply("❌ ギルドが見つからない or APIエラー");
    }
  }
});

client.login(process.env.TOKEN);

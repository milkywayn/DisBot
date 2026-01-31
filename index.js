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
    const prefix = interaction.options.getString("prefix");

    await interaction.deferReply();

    try {
      const url = `https://api.wynncraft.com/v3/guild/prefix/${encodeURIComponent(prefix)}`;
      const res = await axios.get(url);
      const g = res.data;

      if (!g || !g.members) {
        return await interaction.editReply("❌ ギルドが見つかりません");
      }

      const allMembers = Object.values(g.members)
        .flatMap(rank => Object.values(rank));

      const total = allMembers.length;
      const online = allMembers.filter(m => m.online).length;

      await interaction.editReply(
        `🏰 **${g.name} [${g.prefix}]**\n` +
        `📈 Level: ${g.level}\n` +
        `🌍 Territories: ${g.territories}\n` +
        `👥 Members: ${total}\n` +
        `🟢 Online: ${online}`
      );

    } catch (err) {
      console.error("Wynncraft API error:", err.message || err);
      await interaction.editReply("❌ ギルドが見つかりません or APIエラー");
    }
  }
});

client.login(process.env.TOKEN);

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
    console.log("INPUT PREFIX:", prefix);

    await interaction.deferReply();

    try {
      const url = `https://api.wynncraft.com/v3/guild/prefix/${encodeURIComponent(prefix)}`;
      console.log("REQUEST URL:", url);

      const res = await axios.get(url, {
        headers: {
          "User-Agent": "DisBot/1.0 (Discord Bot)"
        }
      });

      console.log("API OK");

      const g = res.data;

      const allMembers = Object.values(g.members)
        .flatMap(rank => Object.values(rank));

      await interaction.editReply(`✅ 成功: ${g.name}`);
    } catch (err) {
      console.error("STATUS:", err.response?.status);
      console.error("DATA:", err.response?.data);
      console.error(err);

      await interaction.editReply(
        `❌ APIエラー\nstatus: ${err.response?.status ?? "unknown"}`
      );
    }
  }
});


client.login(process.env.TOKEN);

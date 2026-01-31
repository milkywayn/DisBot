const { EmbedBuilder } = require("discord.js");
const axios = require("axios");

module.exports = {
  async execute(interaction) {
    const prefix = interaction.options.getString("prefix");
    await interaction.deferReply();

    try {
      const url = `https://api.wynncraft.com/v3/guild/prefix/${encodeURIComponent(prefix)}`;
      const res = await axios.get(url, {
        headers: { "User-Agent": "DisBot/1.0" }
      });

      const g = res.data;
      if (!g || !g.members) {
        return interaction.editReply("❌ ギルドが見つかりません");
      }

      // Owner
      const owner = Object.keys(g.members.owner || {})[0] ?? "Unknown";

      // メンバー集計 & オンライン一覧
      const allMembers = [];
      const onlineMembers = [];

      for (const rank of Object.values(g.members)) {
        for (const [name, data] of Object.entries(rank)) {
          allMembers.push(name);
          if (data.online) onlineMembers.push(name);
        }
      }

      const onlineList =
        onlineMembers.length > 0
          ? onlineMembers.slice(0, 20).join(", ")
          : "なし";

      const embed = new EmbedBuilder()
        .setTitle(`🏰 ${g.name} [${g.prefix}]`)
        .setColor(0x00bfff)
        .addFields(
          { name: "👑 Owner", value: owner, inline: true },
          { name: "📈 Level", value: `${g.level} [${g.xpPercent}%]`, inline: true },
          { name: "🌍 Territories", value: String(g.territories), inline: true },
          { name: "⚔ Wars", value: String(g.wars), inline: true },
          {
            name: `🟢 Online Members (${onlineMembers.length})`,
            value: onlineList
          }
        )
        .setFooter({ text: "Data from Wynncraft API" });

      await interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.error(err);
      await interaction.editReply("❌ APIエラー");
    }
  }
};

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

      // メンバー集計
      const allMembers = Object.values(g.members)
        .flatMap(rank => Object.values(rank));

      const total = allMembers.length;
      const online = allMembers.filter(m => m.online).length;

      const embed = new EmbedBuilder()
        .setTitle(`🏰 ${g.name} [${g.prefix}]`)
        .setColor(0x00bfff)
        .addFields(
          { name: "📈 Level", value: String(g.level), inline: true },
          { name: "⭐ XP Progress", value: `${g.xpPercent}%`, inline: true },
          { name: "🌍 Territories", value: String(g.territories), inline: true },
          { name: "⚔ Wars", value: String(g.wars), inline: true },
          { name: "👥 Members", value: `${online} / ${total}`, inline: true }
        )
        .setFooter({ text: "Data from Wynncraft API" });

      await interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.error(err);
      await interaction.editReply("❌ APIエラー");
    }
  }
};

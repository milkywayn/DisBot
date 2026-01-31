const { EmbedBuilder } = require("discord.js");
const axios = require("axios");

const RANK_LABELS = {
  owner: "👑 Owner",
  chief: "⭐ Chief",
  strategist: "🧠 Strategist",
  captain: "🛡 Captain",
  recruiter: "📣 Recruiter",
  recruit: "👤 Recruit"
};

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

      // ランク別オンライン
      const onlineByRank = {};

      for (const [rankKey, members] of Object.entries(g.members)) {
        const online = [];

        for (const [name, data] of Object.entries(members)) {
          if (data.online) online.push(name);
        }

        if (online.length > 0) {
          onlineByRank[rankKey] = online;
        }
      }

      let onlineText = "";
      for (const [rank, members] of Object.entries(onlineByRank)) {
        const label = RANK_LABELS[rank] ?? rank;
        onlineText += `**${label}**\n${members.join(", ")}\n\n`;
      }

      if (!onlineText) onlineText = "なし";

      const embed = new EmbedBuilder()
        .setTitle(`🏰 ${g.name} [${g.prefix}]`)
        .setColor(0x00bfff)
        .addFields(
          { name: "👑 Owner", value: owner, inline: true },
          { name: "📈 Level", value: `${g.level} [${g.xpPercent}%]`, inline: true },
          { name: "🌍 Territories", value: String(g.territories), inline: true },
          { name: "⚔ Wars", value: String(g.wars), inline: true },
          {
            name: "🟢 Online Members",
            value: onlineText
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

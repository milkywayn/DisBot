const { EmbedBuilder } = require("discord.js");
const axios = require("axios");

const RANK_ORDER = [
  "owner",
  "chief",
  "strategist",
  "captain",
  "recruiter",
  "recruit"
];

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
      const res = await axios.get(
        `https://api.wynncraft.com/v3/guild/prefix/${encodeURIComponent(prefix)}`,
        { headers: { "User-Agent": "DisBot/1.0" } }
      );

      const g = res.data;

      let totalMembers = 0;
      let onlineCount = 0;
      const onlineByRank = {};

      for (const [rankKey, members] of Object.entries(g.members)) {
        const online = [];

        for (const [name, data] of Object.entries(members)) {
          totalMembers++;

          if (data.online) {
            onlineCount++;
            const server = data.server ?? "?";
            const wars = Number.isInteger(data.wars) ? data.wars : 0;
            online.push(`${name} (${server} | ${wars} wars)`);
        }

        }

        if (online.length > 0) {
          onlineByRank[rankKey] = online;
        }
      }

      let onlineText = "";
      for (const rank of RANK_ORDER) {
        if (!onlineByRank[rank]) continue;
        onlineText += `**${RANK_LABELS[rank]}**\n${onlineByRank[rank].join(", ")}\n\n`;
      }

      if (!onlineText) onlineText = "なし";

      const owner = Object.keys(g.members.owner || {})[0] ?? "Unknown";

      const embed = new EmbedBuilder()
        .setTitle(`${g.name} [${g.prefix}]`)
        .setColor(0x00bfff)
        .addFields(
          { name: "👑 Owner", value: owner, inline: true },
          { name: "📈 Level", value: `${g.level} [${g.xpPercent}%]`, inline: true },
          { name: "🌍 Territories", value: String(g.territories), inline: true },
          { name: "⚔ Wars", value: String(g.wars), inline: true },
          {
            name: `🟢 Online Members : ${onlineCount}/${totalMembers}`,
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

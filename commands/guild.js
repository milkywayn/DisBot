const { EmbedBuilder } = require("discord.js");
const axios = require("axios");

// プレイヤー war count（失敗しても 0）
async function fetchPlayerWarCount(player) {
  try {
    const res = await axios.get(
      `https://api.wynncraft.com/v3/player/${encodeURIComponent(player)}/characters`
    );

    const chars = Object.values(res.data.data || {});
    let total = 0;

    for (const c of chars) {
      if (typeof c.wars === "number") total += c.wars;
    }

    return total;
  } catch {
    return 0;
  }
}

module.exports = {
  async execute(interaction) {
    const prefix = interaction.options.getString("prefix");
    await interaction.deferReply();

    let g;
    try {
      const res = await axios.get(
        `https://api.wynncraft.com/v3/guild/prefix/${encodeURIComponent(prefix)}`,
        { headers: { "User-Agent": "DiscordBot/1.0" } }
      );
      g = res.data;
    } catch {
      return interaction.editReply("❌ ギルド取得に失敗しました");
    }

    if (!g?.members) {
      return interaction.editReply("❌ ギルドが見つかりません");
    }

    let totalMembers = 0;
    let onlineCount = 0;

    const onlineByRank = {
      owner: [],
      chief: [],
      strategist: [],
      captain: [],
      recruiter: [],
      recruit: []
    };

    for (const [rank, members] of Object.entries(g.members)) {
      for (const [name, data] of Object.entries(members)) {
        totalMembers++;
        if (data.online) {
          onlineCount++;
          onlineByRank[rank].push({
            name,
            server: data.server ?? "?"
          });
        }
      }
    }

    // wars（最大 15 人までに制限 → API 落ち防止）
    const onlineList = Object.values(onlineByRank).flat().slice(0, 15);
    const warCounts = await Promise.all(
      onlineList.map(p => fetchPlayerWarCount(p.name))
    );

    let warIndex = 0;
    let onlineText = "";

    for (const [rank, players] of Object.entries(onlineByRank)) {
      if (!players.length) continue;

      onlineText += `**${rank.toUpperCase()}**\n`;

      for (const p of players) {
        const wars = warCounts[warIndex] ?? 0;
        warIndex++;
        onlineText += `• ${p.name} (${p.server} | ${wars} wars)\n`;
      }
      onlineText += "\n";
    }

    if (!onlineText) onlineText = "なし";

    const embed = new EmbedBuilder()
      .setTitle(`${g.name} [${g.prefix}]`)
      .setColor(0x00bfff)
      .addFields(
        { name: "📈 Level", value: `${g.level} [${g.xpPercent}%]`, inline: true },
        { name: "👑 Owner", value: g.owner?.name ?? "Unknown", inline: true },
        { name: "🌍 Territories", value: String(g.territories), inline: true },
        { name: "⚔ Wars", value: String(g.wars), inline: true },
        {
          name: `🟢 Online Members : ${onlineCount}/${totalMembers}`,
          value: onlineText
        }
      );

    await interaction.editReply({ embeds: [embed] });
  }
};

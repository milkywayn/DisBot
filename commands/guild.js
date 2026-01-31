const { EmbedBuilder } = require("discord.js");
const axios = require("axios");

// プレイヤーの wars（globalData.wars）取得
async function fetchPlayerWarCount(player) {
  try {
    const res = await axios.get(
      `https://api.wynncraft.com/v3/player/${encodeURIComponent(player)}`,
      { headers: { "User-Agent": "DiscordBot/1.0" } }
    );
    return res.data?.globalData?.wars ?? 0;
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

    // 👑 Owner 正しい取得方法
    const ownerEntry = Object.entries(g.members.owner ?? {})[0];
    const ownerName = ownerEntry?.[0] ?? "Unknown";
    const ownerServer = ownerEntry?.[1]?.server;
    const ownerText = ownerServer
      ? `${ownerName} (${ownerServer})`
      : ownerName;

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

    // オンラインプレイヤー（API負荷対策：最大15人）
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
        { name: "👑 Owner", value: ownerText, inline: true },
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
  }
};

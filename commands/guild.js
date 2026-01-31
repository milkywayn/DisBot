const { EmbedBuilder } = require("discord.js");
const axios = require("axios");

// プレイヤーの war count を取得（全キャラ合算）
async function fetchPlayerWarCount(player) {
  try {
    const res = await axios.get(
      `https://api.wynncraft.com/v3/player/${encodeURIComponent(player)}/characters`
    );

    const chars = Object.values(res.data.data || {});
    let totalWars = 0;

    for (const c of chars) {
      if (typeof c.wars === "number") {
        totalWars += c.wars;
      }
    }

    return totalWars;
  } catch (e) {
    console.error(`player api error: ${player}`, e.response?.status);
    return 0;
  }
}

module.exports = {
  async execute(interaction) {
    const prefix = interaction.options.getString("prefix");
    await interaction.deferReply();

    try {
      // ギルド API
      const res = await axios.get(
        `https://api.wynncraft.com/v3/guild/prefix/${encodeURIComponent(prefix)}`,
        { headers: { "User-Agent": "DiscordBot/1.0" } }
      );

      const g = res.data;
      if (!g || !g.members) {
        return interaction.editReply("❌ ギルドが見つかりません");
      }

      let totalMembers = 0;
      let onlineCount = 0;

      // ランク別オンライン管理
      const onlineByRank = {
        owner: [],
        chief: [],
        strategist: [],
        captain: [],
        recruiter: [],
        recruit: []
      };

      // メンバー走査
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

      // オンライン全員の war count を取得
      const allOnlinePlayers = Object.values(onlineByRank).flat();
      const warCounts = await Promise.all(
        allOnlinePlayers.map(p => fetchPlayerWarCount(p.name))
      );

      // rank別テキスト作成
      let warIndex = 0;
      let onlineText = "";

      for (const [rank, players] of Object.entries(onlineByRank)) {
        if (players.length === 0) continue;

        onlineText += `**${rank.toUpperCase()}**\n`;

        for (const p of players) {
          const wars = warCounts[warIndex++] ?? 0;
          onlineText += `• ${p.name} (${p.server} | ${wars} wars)\n`;
        }

        onlineText += "\n";
      }

      if (!onlineText) {
        onlineText = "なし";
      }

      // Embed 作成
      const embed = new EmbedBuilder()
        .setTitle(`🏰 ${g.name} [${g.prefix}]`)
        .setColor(0x00bfff)
        .addFields(
          {
            name: "📈 Level",
            value: `${g.level} [${g.xpPercent}%]`,
            inline: true
          },
          {
            name: "👑 Owner",
            value: g.owner,
            inline: true
          },
          {
            name: "🌍 Territories",
            value: String(g.territories),
            inline: true
          },
          {
            name: "⚔ Wars",
            value: String(g.wars),
            inline: true
          },
          {
            name: `🟢 Online Members : ${onlineCount}/${totalMembers}`,
            value: onlineText
          }
        );

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error(error);
      await interaction.editReply("❌ API エラー (500 など)");
    }
  }
};

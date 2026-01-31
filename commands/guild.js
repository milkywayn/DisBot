const { EmbedBuilder } = require("discord.js");
const axios = require("axios");

// Wynncraft プレイヤー情報取得
async function fetchPlayerWarCount(player) {
  try {
    // プレイヤー API （character 全体を取得）
    const res = await axios.get(
      `https://api.wynncraft.com/v3/player/${encodeURIComponent(player)}/characters`
    );

    const chars = res.data.data || [];
    // war count を合算
    let totalWars = 0;
    chars.forEach(c => {
      if (typeof c.wars === "number") {
        totalWars += c.wars;
      }
    });

    return totalWars;
  } catch (e) {
    console.error(`player api error: ${player}`, e.response?.status);
    return null;
  }
}

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
      if (!g || !g.members) {
        return interaction.editReply("ギルドが見つかりません");
      }

      // プレイヤー統計
      let totalMembers = 0;
      let onlineCount = 0;
      const onlinePlayers = [];

      for (const members of Object.values(g.members)) {
        for (const name of Object.keys(members)) {
          totalMembers++;
          const data = members[name];
          if (data.online) {
            onlineCount++;
            onlinePlayers.push({ name, server: data.server });
          }
        }
      }

      // player API 一斉取得
      const warPromises = onlinePlayers.map(p =>
        fetchPlayerWarCount(p.name)
      );

      const warResults = await Promise.all(warPromises);

      // online text 作成
      let onlineText = "";
      onlinePlayers.forEach((p, i) => {
        const wars = warResults[i] ?? 0;
        onlineText += `${p.name} (${p.server} | ${wars} wars)\n`;
      });

      if (!onlineText) onlineText = "なし";

      const embed = new EmbedBuilder()
        .setTitle(`${g.name} [${g.prefix}]`)
        .setColor(0x00bfff)
        .addFields(
          { name: "📈 Level", value: `${g.level} [${g.xpPercent}%]`, inline: true },
          { name: "🌍 Territories", value: String(g.territories), inline: true },
          { name: "⚔ Wars", value: String(g.wars), inline: true },
          {
            name: `🟢 Online Members : ${onlineCount}/${totalMembers}`,
            value: onlineText
          }
        );

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error(error);
      await interaction.editReply("API エラー");
    }
  }
};

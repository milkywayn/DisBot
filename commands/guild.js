const { EmbedBuilder } = require("discord.js");
const axios = require("axios");

// ギルドキャッシュ（ギルド単位）
const guildCache = {};
const CACHE_TIME = 60 * 1000; // 1分

// ギルド情報取得（キャッシュ付き）
async function fetchGuildData(prefix) {
  const now = Date.now();

  // キャッシュがあり、期限内なら返す
  if (guildCache[prefix] && now - guildCache[prefix].time < CACHE_TIME) {
    return guildCache[prefix].data;
  }

  try {
    // ギルド情報取得
    const res = await axios.get(
      `https://api.wynncraft.com/v3/guild/prefix/${encodeURIComponent(prefix)}`,
      { headers: { "User-Agent": "DiscordBot/1.0" } }
    );
    const g = res.data;

    if (!g?.members) return null;

    // オンラインプレイヤーリスト（最大15人）
    const onlineByRank = {
      owner: [],
      chief: [],
      strategist: [],
      captain: [],
      recruiter: [],
      recruit: []
    };

    let totalMembers = 0;
    let onlineCount = 0;

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

    const onlineList = Object.values(onlineByRank).flat().slice(0, 15);

    // warsをまとめて取得
    const warCounts = await Promise.all(
      onlineList.map(p => fetchPlayerWarCount(p.name))
    );

    // オンラインプレイヤー情報に wars を付与
    let warIndex = 0;
    for (const [rank, players] of Object.entries(onlineByRank)) {
      for (const p of players) {
        p.wars = warCounts[warIndex++] ?? 0;
      }
    }

    // キャッシュに保存
    const cacheData = {
      g,
      onlineByRank,
      onlineCount,
      totalMembers
    };
    guildCache[prefix] = { data: cacheData, time: now };

    return cacheData;

  } catch {
    return null;
  }
}

// プレイヤー wars キャッシュ（1分 TTL）
const warCache = {};
const WAR_CACHE_TIME = 60 * 1000;
async function fetchPlayerWarCount(player) {
  const now = Date.now();
  if (warCache[player] && now - warCache[player].time < WAR_CACHE_TIME) {
    return warCache[player].wars;
  }

  try {
    const res = await axios.get(
      `https://api.wynncraft.com/v3/player/${encodeURIComponent(player)}`,
      { headers: { "User-Agent": "DiscordBot/1.0" } }
    );
    const wars = res.data?.globalData?.wars ?? 0;
    warCache[player] = { wars, time: now };
    return wars;
  } catch {
    return 0;
  }
}

module.exports = {
  async execute(interaction) {
    const prefix = interaction.options.getString("prefix");
    await interaction.deferReply();

    const cacheData = await fetchGuildData(prefix);
    if (!cacheData) return interaction.editReply("❌ ギルド取得に失敗しました");

    const { g, onlineByRank, onlineCount, totalMembers } = cacheData;

    // Owner 情報
    const ownerEntry = Object.entries(g.members.owner ?? {})[0];
    const ownerName = ownerEntry?.[0] ?? "Unknown";
    const ownerServer = ownerEntry?.[1]?.server;
    const ownerText = ownerServer ? `${ownerName} (${ownerServer})` : ownerName;

    // オンラインメンバー文字列作成
    let onlineText = "";
    for (const [rank, players] of Object.entries(onlineByRank)) {
      if (!players.length) continue;
      onlineText += `**${rank.toUpperCase()}**\n`;

      for (const p of players) {
        const wars = p.wars ?? 0;
        // wars 1000以上は強調
        const warsText = wars >= 1000 ? `**${wars} wars**` : `${wars} wars`
        onlineText += `● ${p.name} (${p.server} | ${p.wars} wars)\n`;
      }
      onlineText += "\n";
    }
    if (!onlineText) onlineText = "なし";

    const embed = new EmbedBuilder()
      .setTitle(`${g.name} [${g.prefix}]`)
      .setColor(0x00bfff)
      .addFields(
        { name: "👑 Owner", value: ownerText, inline: true },
        { name: "⭐️ Level", value: `${g.level} [${g.xpPercent}%]`, inline: true },
        { name: "🌍 Territories", value: String(g.territories), inline: true },
        { name: "⚔️ Wars", value: String(g.wars), inline: true },
        { name: `🟢 Online Members : ${onlineCount}/${totalMembers}`, value: onlineText }
      )
      .setFooter({ text: "Data from Wynncraft API" });

    await interaction.editReply({ embeds: [embed] });
  }
};

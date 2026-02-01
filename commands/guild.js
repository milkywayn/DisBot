const { EmbedBuilder } = require("discord.js");
const axios = require("axios");

// ギルドキャッシュ（ギルド単位）
const guildCache = {};
const CACHE_TIME = 60 * 1000; // 1分

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

// ギルド情報取得（キャッシュ付き）
async function fetchGuildData(prefix) {
  const now = Date.now();
  if (guildCache[prefix] && now - guildCache[prefix].time < CACHE_TIME) {
    return guildCache[prefix].data;
  }

  try {
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

    let warIndex = 0;
    for (const [rank, players] of Object.entries(onlineByRank)) {
      for (const p of players) {
        p.wars = warCounts[warIndex++] ?? 0;
      }
    }

    const cacheData = { g, onlineByRank, onlineCount, totalMembers };
    guildCache[prefix] = { data: cacheData, time: now };

    return cacheData;

  } catch {
    return null;
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

    // Embed 作成
    const embed = new EmbedBuilder()
      .setTitle(`${g.name} [${g.prefix}]`)
      .setColor(0x00bfff)
      .addFields(
        { name: "👑 Owner", value: ownerText, inline: true },
        { name: "⭐️ Level", value: `${g.level} [${g.xpPercent}%]`, inline: true },
        { name: "🌍 Territories", value: String(g.territories), inline: true },
        { name: "⚔️ Wars", value: String(g.wars), inline: true }
      )
      .setFooter({ text: "Data from Wynncraft API" });

    // オンラインメンバーをフィールドごとに追加（最大25フィールド）
    let fieldCount = 0;
    for (const [rank, players] of Object.entries(onlineByRank)) {
      for (const p of players) {
        if (fieldCount >= 25) break; // Embedのフィールド制限
        const warsText = p.wars >= 1000 ? `⚔️ ${p.wars} wars` : `${p.wars} wars`;
        embed.addFields({
          name: `${p.name} (${rank.toUpperCase()})`,
          value: `${p.server} | ${warsText}`,
          inline: true
        });
        fieldCount++;
      }
    }

    await interaction.editReply({ embeds: [embed] });
  }
};

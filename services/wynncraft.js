const axios = require("axios");

async function getGuild(name) {
  try {
    const res = await axios.get(
      `https://api.wynncraft.com/v3/guild/${encodeURIComponent(name)}`
    );

    const g = res.data;

    return {
      name: g.name,
      level: g.level,
      xpPercent: g.xpPercent,
      territories: g.territories,
      wars: g.wars,
    };
  } catch (e) {
    return null;
  }
}

module.exports = { getGuild };

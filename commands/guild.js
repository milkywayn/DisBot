const axios = require("axios");

module.exports = {
  async execute(interaction) {
    const prefix = interaction.options.getString("prefix");
    await interaction.deferReply();

    const url = `https://api.wynncraft.com/v3/guild/prefix/${encodeURIComponent(prefix)}`;
    const res = await axios.get(url);

    const g = res.data;

    if (!g || !g.name) {
      return interaction.editReply("❌ ギルドが見つかりません");
    }

    await interaction.editReply(
      `🏰 ${g.name} [${g.prefix}]`
    );
  }
};

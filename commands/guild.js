const { EmbedBuilder } = require("discord.js");
const { getGuild } = require("../services/wynncraft");

module.exports = {
  async execute(interaction) {
    const guildName = interaction.options.getString("name");

    await interaction.deferReply();

    const data = await getGuild(guildName);
    if (!data) {
      return interaction.editReply("ギルドが見つからなかった");
    }

    const embed = new EmbedBuilder()
      .setTitle(data.name)
      .setColor(0x00ffff)
      .addFields(
        { name: "Level", value: String(data.level), inline: true },
        { name: "XP", value: `${data.xpPercent}%`, inline: true },
        { name: "Territories", value: String(data.territories), inline: true },
        { name: "Wars", value: String(data.wars), inline: true }
      );

    await interaction.editReply({ embeds: [embed] });
  },
};

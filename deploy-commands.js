require("dotenv").config();
const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [
  new SlashCommandBuilder()
    .setName("guild")
    .setDescription("Wynncraftのギルド情報を表示")
    .addStringOption(option =>
      option
        .setName("name")
        .setDescription("ギルド名")
        .setRequired(true)
    )
    .toJSON()
];

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("🔄 スラッシュコマンド登録中...");

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log("✅ スラッシュコマンド登録完了！");
  } catch (error) {
    console.error(error);
  }
})();

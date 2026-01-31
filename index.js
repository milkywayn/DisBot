const { Client, GatewayIntentBits, Events } = require("discord.js");
const guildCommand = require("./commands/guild");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "guild") {
    await guildCommand.execute(interaction);
  }
});

client.login(process.env.TOKEN);

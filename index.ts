import { Client, Events, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import commands from "./text-commands";

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

const prefix = "v.";

client.on(Events.MessageCreate, async (message) => {
  try {
    if (!message.content.toLowerCase().startsWith(prefix) || message.author.bot)
      return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift();

    if (!command) {
      await message.channel.send("Invalid Argument");
      return;
    }

    switch (command) {
      case "start":
        commands.start(message, args);
        break;

      case "help":
        commands.help(message);
        break;

      case "end":
        commands.end(message);
        break;

      default:
        await message.channel.send("Invalid Command");
        return;
    }
  } catch (error) {
    console.log(error);
    await message.channel.send("An error occured while executing the command.");
    return;
  }
});

client.on(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.login(process.env.TOKEN);

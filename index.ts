import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  Message,
} from "discord.js";
import * as dotenv from "dotenv";
import path from "path";
import commands from "./text-commands";

dotenv.config();

if (process.env.NODE_ENV === "development")
  dotenv.config({ path: path.resolve(__dirname, ".env.development") });
else dotenv.config({ path: path.resolve(__dirname, ".env.production") });

export const prefix = process.env.NODE_ENV === "production" ? "v." : "vd.";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

export const games: Collection<string, string> = new Collection();

client.on(Events.MessageCreate, async (message: Message<boolean>) => {
  try {
    if (!message.content.toLowerCase().startsWith(prefix) || message.author.bot)
      return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift();

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
        await message.channel.send(
          "Invalid Command. Use `v.help` for more information"
        );
        return;
    }
  } catch (error) {
    console.log(error);
    return;
  }
});

process.on("unhandledRejection", async (error: any) => {
  try {
    await client.users.cache
      .get("874540112371908628")
      ?.send(`Unhandled Rejection \`\`\`${error}\`\`\``);
  } catch (error) {
    console.log("Unhandled Rejection - ", error);
  }
});

process.on("uncaughtException", async (error) => {
  try {
    await client.users.cache
      .get("874540112371908628")
      ?.send(`Unhandled Rejection \`\`\`${error}\`\`\``);
  } catch (error) {
    console.log("Uncaught Exception - ", error);
  }
});

process.on("uncaughtExceptionMonitor", async (error, origin) => {
  try {
    await client.users.cache
      .get("874540112371908628")
      ?.send(`Unhandled Rejection \`\`\`${error}\`\`\`\`\`\`${origin}\`\`\``);
  } catch (error) {
    console.log("Uncaught Exception Monitor - ", error, origin);
  }
});

client.on(Events.Error, (error: any) => {
  console.log("Discord.js Error - ", error.message);
  client.users.cache
    .get("874540112371908628")
    ?.send(`An unexpected error occured \`\`\`${error.message}\`\`\``);
});

client.on(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.login(process.env.TOKEN);

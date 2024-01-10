import {
  AttachmentBuilder,
  Collection,
  EmbedBuilder,
  Message,
  User,
} from "discord.js";
import {
  createCanvasImage,
  generateRandomNumberInARange,
  wait,
} from "../utils/helper";
import { Games } from "..";
import { messageEmbed } from "../embeds/treasure-trail";
import path from "path";

export default class TreasureTrail {
  private currentRound: number;
  private games: Games;
  private message: Message<boolean>;
  private numberOfPlayersWithPoints: number;
  private points: Collection<string, number>;
  private rounds: number;
  private gameInfo: Collection<
    string,
    number | boolean | Collection<string, number>
  >;

  constructor(message: Message<boolean>, games: Games) {
    this.message = message;
    this.games = games;

    this.gameInfo = this.createTreasureTrailGame();
    this.games.set(message.channelId, this.gameInfo);

    this.points = this.gameInfo.get("points") as Collection<string, number>;
    this.numberOfPlayersWithPoints = 0;
    this.currentRound = 0;
    this.rounds = 3;

    this.message.channel.send({
      embeds: messageEmbed("Starting Treasure Trail... "),
    });
  }

  private getMaxPointsHolder(points: Collection<string, number>) {
    return points.reduce(
      (max, points, userId) => (points > max.points ? { userId, points } : max),
      { userId: "", points: -1 }
    );
  }

  private createTreasureTrailGame() {
    const gameInfo = new Collection<
      string,
      number | boolean | Collection<string, number>
    >();

    gameInfo.set("active", true);
    gameInfo.set("points", new Collection<string, number>());

    return gameInfo;
  }

  async playRound() {
    console.log("Game Started");
    this.currentRound++;

    let min = 99;
    let max = 999;

    let closestGuesser: null | string = null;
    let closestGuess = Number.MAX_SAFE_INTEGER;
    let minDifference = Number.MAX_SAFE_INTEGER;

    let userLoot =
      this.numberOfPlayersWithPoints > 3 && Math.random() > 0.7 ? true : false;
    const randomPlayer = this.points.randomKey();
    let randomPlayerUser: User | null = null;

    if (userLoot && randomPlayer) {
      max = Math.min(999, (this.points.get(randomPlayer) as number) * 0.5);
      const user = this.message.client.users.cache.get(randomPlayer as string);
      if (user) randomPlayerUser = user;
    }

    let numberToGuess = generateRandomNumberInARange(min, max);
    console.log("Setting the number to guess: ", numberToGuess);

    const collector = this.message.channel.createMessageCollector({
      filter: (msg) => !msg.author.bot && !isNaN(parseInt(msg.content)),
      time: 30000,
    });

    if (this.games.get(this.message.channelId) === undefined) return;

    if (!userLoot)
      this.message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle(
              "A mysterious treasure chest has appeared! <:treasure:1194161940650536981>"
            )
            .setDescription(
              `Guess the closest number to coins to win that treasure :D`
            ),
        ],
      });
    else {
      this.message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle(
              `${randomPlayerUser} accidently dropped their coins! <:gold:1194161918940827659>`
            )
            .setDescription(
              `Guess the closest number to coins to steal them coins!`
            ),
        ],
      });
    }

    collector.on("collect", (msg) => {
      if (this.games.get(this.message.channelId) === undefined) {
        collector.stop();
        return;
      }

      const numberGuessed = parseInt(msg.content);

      if (typeof numberGuessed === "number") {
        const difference = Math.abs(numberToGuess - numberGuessed);

        if (difference <= minDifference) {
          minDifference = difference;
          closestGuess = numberGuessed;
          closestGuesser = msg.author.id;
        }
      }
    });

    collector.on("end", async () => {
      if (this.games.get(this.message.channelId) === undefined) return;

      if (closestGuesser !== null) {
        const user = this.message.client.users.cache.get(closestGuesser);

        const playerPoints = this.points.get(closestGuesser);
        const newPoints =
          closestGuess > numberToGuess ? numberToGuess : closestGuess;

        this.points.set(
          closestGuesser,
          playerPoints ? playerPoints + newPoints : newPoints
        );

        this.numberOfPlayersWithPoints++;

        if (userLoot && closestGuesser !== randomPlayer) {
          this.points.set(
            randomPlayer as string,
            (this.points.get(randomPlayer as string) as number) - newPoints
          );

          const message = await this.message.channel.send({
            embeds: messageEmbed(
              `${randomPlayerUser}, ${user} stole your coins coins! *(gossips...)* :joy:`
            ),
          });

          await wait(2);

          await message.edit({
            embeds: messageEmbed(
              `${randomPlayerUser}, ${user} stole your coins coins! 🫢`
            ),
          });
        }

        await this.message.channel.send({
          embeds: messageEmbed(
            `Congratulations ${user}, you won ${newPoints} coins! 🤑`
          ),
        });
      }

      await wait(10);

      if (this.currentRound < this.rounds) this.playRound();
      else this.endRound();
    });
  }

  private async endRound() {
    if (this.games.get(this.message.channelId) === undefined) return;

    const winner = this.getMaxPointsHolder(this.points);
    await wait(5);

    const user = this.message.client.users.cache.get(winner.userId);

    if (Math.random() > 0.8) {
      this.message.channel.send({
        embeds: messageEmbed(`Guys ${user} got a very good luck! :eyes:`),
      });

      await wait(4);
    }

    const attachment = new AttachmentBuilder(
      await createCanvasImage(
        path.join(__dirname, "../../assets/winner.png"),
        user
      ),
      { name: "winner.webp" }
    );

    this.message.channel.send({
      files: [attachment],
      embeds: messageEmbed(
        `Congratulations ${user} for winning the game with ${winner.points} <:treasure1:1194161932362580150>`
      ),
    });
  }
}

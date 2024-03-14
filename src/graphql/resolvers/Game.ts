import {
  Resolver,
  Mutation,
  Arg,
  Query,
  Authorized,
  Ctx,
  ArgsType,
  Field,
  FieldResolver,
  Root,
  ObjectType,
} from "type-graphql";
import { AuthPayload } from "../../utils/auth";
import GameModel, { Game, HalfMoveInput } from "../../models/Game";
import UserModel from "../../models/User";
import transporter, { readHTML, insertParams } from "../../utils/mail";
import { Chess, HalfMove } from "@ammar-ahmed22/chess-engine";
import { toHTML, toPlainText } from "../../emails";
import MovePlayed, { MovePlayedProps } from "../../emails/MovePlayed";

@ArgsType()
class AddMoveArgs {
  @Field(returns => HalfMoveInput, { description: "The executed move." })
  public executedMove: HalfMoveInput;

  @Field({ description: "Game ID for game to add move to." })
  public gameID: string;
}

@ObjectType({ description: "Game ID sent when new game created." })
class CreateGameResponse {
  @Field()
  gameID: string;
}

type SendMovePlayerEmailOpts = {
  oppEmail: string;
  playerEmail: string;
  firstName: string;
  movePlayed: HalfMove;
  gameID: string;
};

@Resolver(of => Game)
export class GameResolver {
  constructor(private mailer = transporter) {}

  private sendMovePlayerEmail = async ({
    oppEmail,
    playerEmail,
    firstName,
    gameID,
    movePlayed,
  }: SendMovePlayerEmailOpts) => {
    const gameLink = `${
      process.env.NODE_ENV === "production"
        ? "https://ammarahmed.ca"
        : "http://localhost:3000"
    }/chess/play/${gameID}`;
    const html = toHTML<MovePlayedProps>(MovePlayed, {
      playerName: firstName,
      playerEmail: playerEmail,
      gameLink,
      movePlayed,
    });
    const plainText = toPlainText<MovePlayedProps>(MovePlayed, {
      playerName: firstName,
      playerEmail: playerEmail,
      gameLink,
      movePlayed,
    });

    this.mailer.sendMail({
      from: "Ammar Ahmed <ammar@ammarahmed.ca>",
      to: oppEmail,
      subject: `${firstName} Played Their Move!`,
      text: plainText,
      html,
    });
  };

  private getOpponentGameID = (
    userID: string,
    playerIDs: { white: string; black: string }
  ) => (playerIDs.white === userID ? playerIDs.black : playerIDs.white);

  @Authorized()
  @Mutation(returns => CreateGameResponse, {
    description: "Creates new game. (Authorized)",
  })
  async createGame(@Ctx() ctx: Context) {
    const user = await UserModel.findById(ctx.userId);
    const me = await UserModel.findOne({ email: "a353ahme@uwaterloo.ca" });

    if (!user || !me) throw new Error("Not found.");

    // if (user.currentGameID)
    //   throw new Error("A game is active. Cannot create another.");

    const game = await GameModel.create({
      colorToMove: "w",
      playerIDs: {
        white: user._id,
        black: me._id,
      },
    });

    // user.currentGameID = game._id;
    user.gameIDs.push(game._id);
    me.gameIDs.push(game._id);
    await user.save();
    await me.save();

    console.log("game created with id:", game._id);
    return { gameID: game._id };
  }

  @Authorized()
  @Mutation(returns => AuthPayload, {
    description: "Adds move to game. (Authorized)",
  })
  async addMove(
    @Ctx() ctx: Context,
    @Arg("gameID") gameID: string,
    @Arg("executedMove", type => HalfMoveInput, { validate: true })
    executedMove: HalfMoveInput
  ) {
    const user = await UserModel.findById(ctx.userId);

    if (!user) throw new Error("User not found.");
    if (!user.gameIDs.includes(gameID)) throw new Error("Game not available.");
    // if (!gameID && !user.currentGameID) throw new Error("No active game.");

    const game = await GameModel.findById(gameID);

    if (!game) throw new Error("Game not found.");

    const oppID = this.getOpponentGameID(user._id.toString(), game.playerIDs);

    const opponent = await UserModel.findById(oppID);

    if (!opponent) throw new Error("Opponent not found.");
    const chess = new Chess();
    chess.setMoves(game.history);
    const lastMove = game.history.at(-1);
    if (lastMove) {
      if (lastMove.black) {
        chess.setPosition(lastMove.black.state.fen);
      } else {
        chess.setPosition(lastMove.white.state.fen);
      }
    }

    const result = chess.execute(executedMove, {
      validate: true,
      silent: true,
    });
    if (!result) throw new Error("Move is invalid!");

    await GameModel.updateOne(
      { _id: gameID },
      { $set: { history: chess.history(), colorToMove: chess.colorToMove() } }
    );

    const emailParams: SendMovePlayerEmailOpts = {
      oppEmail: opponent.email,
      playerEmail: user.email,
      firstName: user.firstName,
      gameID: game._id.toString(),
      movePlayed: result,
    };

    await this.sendMovePlayerEmail(emailParams);

    return new AuthPayload({ id: user._id });
  }

  @Authorized()
  @Query(returns => Game, { description: "Gets game. (Authorized)" })
  async game(@Ctx() ctx: Context, @Arg("gameID") gameID: string) {
    const game = await GameModel.findById(gameID).lean().exec();

    if (!game) throw new Error("Game not found!");

    return game;
  }

  @Authorized()
  @Query(returns => [Game], {
    description: "Gets all games for user. (Authorized)",
  })
  async games(@Ctx() ctx: Context) {
    const user = await UserModel.findById(ctx.userId);

    if (!user) throw new Error("User not found.");

    const { gameIDs } = user;

    const result = await Promise.all(
      gameIDs.map(async gid => {
        const game = await GameModel.findById(gid).lean().exec();
        return game;
      })
    );

    return result;
  }

  @FieldResolver(of => Game)
  lastHalfMove(@Root() game: Game) {
    const lastFull = game.history.at(-1);
    if (lastFull) {
      if (lastFull.black) return lastFull.black;
      return lastFull.white;
    }
  }
}

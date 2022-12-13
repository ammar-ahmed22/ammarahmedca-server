import {
  Resolver,
  Mutation,
  Arg,
  Query,
  Authorized,
  Ctx,
  Int,
  ArgsType,
  Field,
  Args,
  FieldResolver,
  Root,
  ObjectType,
} from "type-graphql";
import { AuthPayload } from "../../utils/auth";
import GameModel, { BoardOptsInput, Game, ExecutedMoveInput } from "../../models/Game";
import UserModel from "../../models/User";
import transporter, { readHTML, insertParams, getParamNames } from "../../utils/mail";

@ArgsType()
class AddMoveArgs {
  @Field()
  public fen: string;

  @Field(returns => ExecutedMoveInput)
  executedMove: ExecutedMoveInput

  @Field({ nullable: true })
  public boardOpts?: BoardOptsInput;

  @Field((returns) => [String])
  public whiteTakes: string[];

  @Field((returns) => [String])
  public blackTakes: string[];

  @Field()
  public gameID: string
}

@ObjectType()
class CreateGameResponse{
  @Field()
  gameID: string
}

type SendMovePlayerEmailOpts = {
  email: string,
  opponentName: string,
  piece: string,
  from: string,
  to: string,
  gameID: string,
  takenPiece?: string
}

@Resolver(of => Game)
export class GameResolver {
  constructor(private mailer = transporter){}

  private sendMovePlayerEmail = async ({ email, opponentName, from, to, piece, gameID, takenPiece} : SendMovePlayerEmailOpts) => {
    const html = readHTML("../emails/move-played.html");
    // params: opponent, piece, to, takeDescription, linkToGame, from
    const params : Record<string, any> = {
      opponent: opponentName,
      piece,
      from,
      to,
      linkToGame: `${process.env.NODE_ENV === "production" ? "https://ammarahmed.ca" : "http://localhost:3000"}/chess/play/${gameID}`,
      takeDescription: takenPiece ? ` and took your ${takenPiece}` : "",
    }
    const updated = insertParams(html, params);
    console.log(getParamNames(html));
    this.mailer.sendMail({
      from: "Ammar Ahmed <ammar@ammarahmed.ca>",
      to: email,
      subject: `${opponentName} Played Their Move!`,
      text: "Plain text is not supported yet :(",
      html: updated,
    })
  }

  private getOpponentGameID = (userID: string, playerIDs: { white: string, black: string }) => playerIDs.white === userID ? playerIDs.black : playerIDs.white;

  private toAlgebraic = (a : { rank: number, file: string }) => {
    return `${a.file}${a.rank}`
  }

  @Query(returns => String)
  async testMovePlayerEmail(){
    await this.sendMovePlayerEmail({
      email: "ammar.ahmed2203@gmail.com",
      opponentName: "Yoski",
      piece: "queen",
      from: "e4",
      to: "e5",
      gameID: "ajsdfgjsgjsjdfg",
      takenPiece: "knight"
    });

    return "success"
  }

  @Authorized()
  @Mutation(returns => CreateGameResponse)
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
  @Mutation(returns => AuthPayload)
  async addMove(
    @Ctx() ctx: Context,
    @Args() { fen, boardOpts, whiteTakes, blackTakes, executedMove, gameID }: AddMoveArgs
  ) {
    const user = await UserModel.findById(ctx.userId);

    if (!user) throw new Error("User not found.");
    if (!user.gameIDs.includes(gameID)) throw new Error("Game not available.")
    // if (!gameID && !user.currentGameID) throw new Error("No active game.");

    const game = await GameModel.findById(gameID);

    if (!game) throw new Error("Game not found.");

    const oppID = this.getOpponentGameID(user._id.toString(), game.playerIDs);
    
    const opponent = await UserModel.findById(oppID);

    if (!opponent) throw new Error("Opponent not found.");
    
    let takenPiece : string | undefined;
    const lastMove = game.moves.at(-1);
    if (lastMove){
      if (game.colorToMove === "w" && lastMove.takes.white.length !== whiteTakes.length){
        takenPiece = whiteTakes.at(-1);
      }

      if (game.colorToMove === "b" && lastMove.takes.black.length !== blackTakes.length){
        takenPiece = blackTakes.at(-1);
      }
    }
    

    game.moves.push({
      fen,
      takes: {
        white: whiteTakes,
        black: blackTakes,
      },
      executedMove
    });
    game.colorToMove = game.colorToMove === "w" ? "b" : "w";

    await game.save();
    await this.sendMovePlayerEmail({
      email: opponent.email,
      opponentName: opponent.firstName,
      from: this.toAlgebraic(executedMove.from),
      to: this.toAlgebraic(executedMove.to),
      piece: executedMove.pieceType,
      gameID: game._id.toString(),
      takenPiece
    })

    return new AuthPayload({ id: user._id });
  }

  @Authorized()
  @Query(returns => Game)
  async game(
    @Ctx() ctx: Context,
    @Arg("gameID") gameID: string
  ) {
    
    const game = await GameModel.findById(gameID).lean().exec();

    if (!game) throw new Error("Game not found!");

    return game;
    
  }

  @Authorized()
  @Query(returns => [Game])
  async games (
    @Ctx() ctx: Context,
  ){

    const user = await UserModel.findById(ctx.userId);

    if (!user) throw new Error("User not found.")

    const { gameIDs } = user;

    const result = await Promise.all(gameIDs.map( async (gid) => {
      const game = await GameModel.findById(gid).lean().exec();
      return game;
    }))

    return result;
  }

  @FieldResolver(of => Game)
  lastMove(@Root() game: Game){
    return game.moves[game.moves.length - 1];
  }
}

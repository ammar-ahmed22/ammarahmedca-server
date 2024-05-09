import { Field, ID, ObjectType, InputType, Int } from "type-graphql";
import { getModelForClass, prop, modelOptions } from "@typegoose/typegoose";
import { Schema, Types } from "mongoose";
import { IsPiece, IsAlgebraic, IsCastle, IsColor } from "../utils/validation";
import { Chess, validateFEN } from "@ammar-ahmed22/chess-engine";
import type ChessEngine from "@ammar-ahmed22/chess-engine";

const algebraicValidator = (a: string): boolean => {
  if (a.length !== 2) return false;
  const [file, rank] = a;
  const charCode = file.charCodeAt(0);
  if (charCode < 97 || charCode > 104) return false;
  const num = parseInt(rank);
  if (isNaN(num)) return false;
  if (num < 1 || num > 8) return false;
  return true;
};

const colorValidator = (c: string): boolean => {
  if (["white", "black"].includes(c)) return true;
  return false;
};

const pieceValidator = (p: string): boolean => {
  if (["queen", "king", "rook", "bishop", "knight", "pawn"].includes(p))
    return true;
  return false;
};

const castleValidator = (s: string): boolean => {
  if (["king", "queen"].includes(s)) return true;
  return false;
};

@ObjectType({
  description: "Object containing the castling ability for one side.",
})
export class ColorCastlingAbility {
  @Field(type => Boolean, { nullable: true })
  @prop({ type: Boolean, required: false })
  king?: boolean;

  @Field(type => Boolean, { nullable: true })
  @prop({ type: Boolean, required: false })
  queen?: boolean;
}

@ObjectType({
  description: "Object containing the castling ability for the game.",
})
export class CastlingAbility implements ChessEngine.CastlingAbility {
  @Field(type => ColorCastlingAbility)
  @prop({ type: ColorCastlingAbility, required: true })
  white: ColorCastlingAbility;

  @Field(type => ColorCastlingAbility)
  @prop({ type: ColorCastlingAbility, required: true })
  black: ColorCastlingAbility;
}

@ObjectType({ description: "Object containing the state of teh game." })
export class GameState implements ChessEngine.GameState {
  @Field(type => String)
  @prop({ type: String, required: true })
  colorToMove: ChessEngine.Color;

  @Field(type => String, { nullable: true })
  @prop({
    type: String,
    required: false,
    validate: {
      validator: algebraicValidator,
      message: "String provided is not an algebraic chess id.",
    },
  })
  enPassant?: string;

  @Field(type => CastlingAbility)
  @prop({ type: CastlingAbility, required: true })
  castling: CastlingAbility;

  @Field()
  @prop({ type: Boolean, required: true })
  inCheck: boolean;
}

@ObjectType({
  description: "Object containing the state of the played half move.",
})
export class HalfMoveState implements ChessEngine.HalfMoveState {
  @Field(type => String)
  @prop({
    type: String,
    validate: {
      validator: validateFEN,
      message: "String is not a valid FEN!",
    },
  })
  fen: string;

  @Field(type => GameState)
  @prop({ type: GameState, required: true })
  gameState: GameState;
}

@ObjectType({ description: "Object containing the move played." })
export class HalfMove implements ChessEngine.HalfMove {
  @Field(type => String)
  @prop({
    type: String,
    required: true,
    validate: {
      validator: algebraicValidator,
      message: "String provided is not an algebraic chess id.",
    },
  })
  from: string;

  @Field(type => String)
  @prop({
    type: String,
    required: true,
    validate: {
      validator: algebraicValidator,
      message: "String provided is not an algebraic chess id.",
    },
  })
  to: string;

  @Field(type => String)
  @prop({
    type: String,
    required: true,
    validate: {
      validator: colorValidator,
      message: "String provided must be 'white' or 'black'",
    },
  })
  color: ChessEngine.Color;

  @Field(type => String)
  @prop({
    type: String,
    required: true,
    validate: {
      validator: pieceValidator,
      message: "String provided is not a valid piece type!",
    },
  })
  piece: ChessEngine.PieceType;

  @Field(type => String, { nullable: true })
  @prop({
    type: String,
    required: false,
    validate: {
      validator: pieceValidator,
      message: "String provided is not a valid piece type!",
    },
  })
  take?: ChessEngine.PieceType;

  @Field(type => String, { nullable: true })
  @prop({
    type: String,
    required: false,
    validate: {
      validator: castleValidator,
      message: "String must be 'king' or 'queen'",
    },
  })
  castle?: ChessEngine.CastleType;

  @Field(type => Boolean, { nullable: true })
  @prop({ type: Boolean, required: false })
  enPassant?: boolean;

  @Field(type => String, { nullable: true })
  @prop({
    type: String,
    required: false,
    validate: {
      validator: colorValidator,
      message: "String must be 'white' or 'black'",
    },
  })
  check?: ChessEngine.Color;

  @Field(type => String, { nullable: true })
  @prop({
    type: String,
    required: false,
    validate: {
      validator: pieceValidator,
      message: "String is not a valid piece type!",
    },
  })
  promotion?: ChessEngine.PieceType;
}

@ObjectType({
  description:
    "Object containing the state and the move played in the half move.",
})
export class CompleteHalfMove implements ChessEngine.CompleteHalfMove {
  @Field(type => HalfMoveState)
  @prop({ type: HalfMoveState, required: true })
  state: HalfMoveState;

  @Field(type => HalfMove)
  @prop({ type: HalfMove, required: true })
  move: HalfMove;

  @Field(type => String)
  @prop({ type: String, required: true })
  algebraic: string;
}

// @ObjectType({
//   description:
//     "Object containing the full move (white and black moves, black is possibly undefined)",
// })
// export class FullMove implements ChessEngine.FullMove {
//   @Field(type => CompleteHalfMove)
//   @prop({ type: CompleteHalfMove, required: true })
//   white: CompleteHalfMove;

//   @Field(type => CompleteHalfMove, { nullable: true })
//   @prop({ type: CompleteHalfMove, required: false })
//   black?: CompleteHalfMove;
// }

@ObjectType({
  description: "Object containing ID's for white and black chess players.",
})
export class Players {
  @Field()
  @prop({ required: true })
  public white: string;

  @Field()
  @prop({ required: true })
  public black: string;
}

@InputType({ description: "Input type for move that is executed" })
export class HalfMoveInput {
  @Field(type => String)
  @IsAlgebraic()
  from: string;

  @Field(type => String)
  @IsAlgebraic()
  to: string;

  @Field(type => String)
  @IsColor()
  color: ChessEngine.Color;

  @Field(type => String)
  @IsPiece()
  piece: ChessEngine.PieceType;

  @Field(type => String, { nullable: true })
  @IsPiece()
  take?: ChessEngine.PieceType;

  @Field(type => String, { nullable: true })
  @IsCastle()
  castle?: ChessEngine.CastleType;

  @Field(type => Boolean, { nullable: true })
  enPassant?: boolean;

  @Field(type => String, { nullable: true })
  @IsColor()
  check?: ChessEngine.Color;

  @Field(type => String, { nullable: true })
  @IsPiece()
  promotion?: ChessEngine.PieceType;
}

@ObjectType({ description: "Data for the game." })
@modelOptions({
  schemaOptions: {
    timestamps: true,
    collection: "games",
  },
})
export class Game {
  @Field(returns => ID, { description: "MongoDB id for game." })
  readonly _id: Schema.Types.ObjectId;

  @Field({ description: "Date game was created at." })
  readonly createdAt: Date;

  @Field(returns => [CompleteHalfMove], {
    description: "Array of moves for the game.",
  })
  @prop({ required: true, default: [], type: CompleteHalfMove })
  public history: Types.Array<CompleteHalfMove>;

  @Field(returns => Players, {
    description: "MongoDB id's for the users playing the game.",
  })
  @prop({ type: Players, required: true })
  public playerIDs: Players;

  @Field(returns => CompleteHalfMove, {
    nullable: true,
    description: "The latest half move.",
  })
  public lastHalfMove?: CompleteHalfMove;

  @Field({ description: "Color to move after the latest move." })
  @prop({ required: true })
  public colorToMove: string;

  @Field({ description: "Status of the game." })
  @prop({ required: true })
  public status: string;
}

export default getModelForClass(Game);

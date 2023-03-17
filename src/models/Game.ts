import { Field, ID, ObjectType, InputType, Int } from "type-graphql";
import {
  getModelForClass,
  modelOptions,
  prop,
  pre,
  DocumentType,
} from "@typegoose/typegoose";
import { Schema, Types } from "mongoose";

const takesValidator = (v: string[]): boolean => {
  for (let i = 0; i < v.length; i++) {
    const p = v[i];
    if (!["pawn", "queen", "bishop", "knight", "rook"].includes(p))
      return false;
  }

  return true;
};

@ObjectType({ description: "Object containing taken pieces." })
export class Takes {
  @Field(returns => [String], {
    description: "Array of white pieces taken by black.",
  })
  @prop({
    required: true,
    default: [],
    type: String,
    validate: {
      validator: takesValidator,
      message: "Invalid piece being added to takes.",
    },
  })
  public white: Types.Array<String>;

  @Field(returns => [String], {
    description: "Array of black pieces taken by white.",
  })
  @prop({
    required: true,
    default: [],
    type: String,
    validate: {
      validator: takesValidator,
      message: "Invalid piece being added to takes.",
    },
  })
  public black: Types.Array<String>;
}

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

@ObjectType({ description: "Options for given move in chess game." })
export class BoardOpts {
  @Field({
    nullable: true,
    description: "FEN string section for castling ability",
  })
  @prop()
  public castling?: string;

  @Field({
    nullable: true,
    description: "Squares in which en passant is possible.",
  })
  @prop()
  public enPassant?: string;

  @Field(returns => Int, { nullable: true, description: "Half move count." })
  @prop()
  public halfMove?: number;

  @Field(returns => Int, { nullable: true, description: "Full move count." })
  @prop()
  public fullMove?: number;
}

@InputType({ description: "Input type for chess game options." })
export class BoardOptsInput implements BoardOpts {
  @Field({ nullable: true })
  public castling?: string;

  @Field({ nullable: true })
  public enPassant?: string;

  @Field(returns => Int, { nullable: true })
  public halfMove?: number;

  @Field(returns => Int, { nullable: true })
  public fullMove?: number;
}

@ObjectType({ description: "Algebraic notation for chess square." })
export class Algebraic {
  @Field(returns => Int, {
    description: "Rank (row, 1-8) number for chess square.",
  })
  @prop({ required: true })
  public rank: number;

  @Field({ description: "File (column, A-H) letter for chess square." })
  @prop({ required: true })
  public file: string;
}

@ObjectType({ description: "Data for chess move that was played." })
export class ExecutedMove {
  @Field(returns => Algebraic, {
    description: "Square that piece was moved from.",
  })
  @prop({ required: true, type: Algebraic })
  public from: Algebraic;

  @Field(returns => Algebraic, {
    description: "Square that piece was moved to.",
  })
  @prop({ required: true, type: Algebraic })
  public to: Algebraic;

  @Field({ description: "Name of the piece that was moved." })
  @prop({ required: true })
  public pieceType: string;

  @Field({ nullable: true, description: "Was check caused by this move." })
  @prop()
  public causedCheck?: boolean;
}

@InputType({ description: "Input type for algebraic notation." })
export class AlgebraicInput extends Algebraic {
  @Field(returns => Int)
  public rank: number;

  @Field()
  public file: string;
}

@InputType({ description: "Input type for move that was executed." })
export class ExecutedMoveInput extends ExecutedMove {
  @Field(returns => AlgebraicInput)
  public from: AlgebraicInput;

  @Field(returns => AlgebraicInput)
  public to: AlgebraicInput;

  @Field()
  public pieceType: string;

  @Field({ nullable: true })
  public causedCheck?: boolean;
}

@ObjectType({ description: "Data for a given half move." })
export class HalfMove {
  @Field({ description: "FEN string for board state after the move was made." })
  @prop({
    required: true,
    validate: {
      validator: (v: string) => {
        return /^([1-8PNBRQK]+\/){7}[1-8PNBRQK]+$/gim.test(v);
      },
      message: "Invalid FEN.",
    },
  })
  public fen: string;

  @Field(returns => BoardOpts, {
    nullable: true,
    description: "Board options for after the move was made.",
  })
  @prop({ type: BoardOpts, default: {} })
  public boardOpts?: BoardOpts;

  @Field(returns => Takes, {
    description: "White and black taken pieces after move was made.",
  })
  @prop({ required: true, default: { white: [], black: [] }, type: Takes })
  public takes: Takes;

  @Field(returns => ExecutedMove, {
    description: "Data for the move that was executed.",
  })
  @prop({ type: ExecutedMove })
  public executedMove: ExecutedMove;
}

@ObjectType({ description: "Data for a given move." })
export class Move {
  @Field({ description: "White player's half move" })
  @prop({ required: true })
  public white: HalfMove;

  @Field({ description: "Black player's half move", nullable: true })
  @prop({ required: false })
  public black?: HalfMove;
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

  @Field(returns => [Move], { description: "Array of moves for the game." })
  @prop({ required: true, default: [], type: Move })
  public moves: Types.Array<Move>;

  @Field(returns => Players, {
    description: "MongoDB id's for the users playing the game.",
  })
  @prop({ type: Players, required: true })
  public playerIDs: Players;

  @Field(returns => HalfMove, {
    nullable: true,
    description: "The latest half move.",
  })
  public lastHalfMove?: HalfMove;

  @Field({ description: "Color to move after the latest move." })
  @prop({ required: true })
  public colorToMove: string;

  @Field({ description: "Status of the game (active, complete)" })
  @prop({ required: true, default: "active" })
  public status: string;
}

export default getModelForClass(Game);

import { Field, ID, ObjectType, InputType, Int } from "type-graphql";
import {
  getModelForClass,
  modelOptions,
  prop,
  pre,
  DocumentType,
} from "@typegoose/typegoose";
import { Schema, Types } from "mongoose";
import bc from "bcryptjs";
import crypto from "crypto";

@ObjectType()
export class Record {
  @Field((returns) => Int)
  @prop({ required: true, default: 0 })
  public wins: number;

  @Field((returns) => Int)
  @prop({ required: true, default: 0 })
  public losses: number;
}

@ObjectType({ description: "User for chess games" })
@modelOptions({
  schemaOptions: {
    timestamps: true,
    collection: "users",
  },
})
@pre<User>("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bc.genSalt(10);

  this.password = await bc.hash(this.password, salt);

  return next();
})
export class User {
  @Field((returns) => ID, { description: "MongoDB id for user." })
  readonly _id: Schema.Types.ObjectId;

  @Field({ description: "Date user was created at." })
  readonly createdAt: Date;

  @Field({ description: "Email address for user."})
  @prop({ required: true, unique: true, validate: /\S+@\S+\.\S+/ })
  public email: string;

  @prop({
    required: true,
    minlength: 6,
    validate: /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z\d])/,
    select: false,
  })
  public password: string;

  @Field({ description: "User's first name."})
  @prop({ required: true })
  public firstName: string;

  @Field({ description: "User's last name."})
  @prop({ required: true })
  public lastName: string;

  @Field({ nullable: true, description: "User's middle name." })
  @prop()
  public middleName?: string;

  @Field({ nullable: true, description: "Company the user works for." })
  @prop()
  public company?: string;

  @Field({ nullable: true, description: "Position the user is in at company." })
  @prop()
  public position?: string;

  @Field({ nullable: true, description: "Where the user found the website." })
  @prop()
  public foundBy?: string;

  @Field({ nullable: true, description: "String representation of profile image." })
  @prop()
  public profilePic?: string;

  @Field((returns) => Record, { description: "Games record for user.s"})
  @prop({ required: true, type: Record, default: { wins: 0, losses: 0 } })
  public record: Record;

  // @Field({ nullable: true })
  // @prop()
  // public currentGameID?: string;

  @Field((returns) => [String], { description: "ID's for games user has played or is playing."})
  @prop({ required: true, default: [], type: String })
  public gameIDs: Types.Array<String>;

  @prop({ required: false })
  public emailConfirmationCode?: number;

  @prop({ required: false })
  public emailConfirmationCodeExpire?: Date;

  @Field({ description: "Whether or not the user's email has been confirmed."})
  @prop({ required: true, default: false })
  public emailConfirmed: boolean;

  @prop({ required: false })
  public resetPasswordToken?: string;

  @prop({ required: false })
  public resetPasswordExpire?: Date;

  public async matchPasswords(this: DocumentType<User>, password: string) {
    const match = await bc.compare(password, this.password);
    return match;
  }

  public async getResetPasswordToken(this: DocumentType<User>) {
    const token = crypto.randomBytes(20).toString("hex");

    this.resetPasswordToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    this.resetPasswordExpire = new Date(Date.now() + 10 * (60 * 1000)); // 10 minutes

    await this.save();

    return token;
  }

  public async createEmailConfirmationCode(this: DocumentType<User>) {
    const code = Math.floor(100000 + Math.random() * 900000);
    this.emailConfirmationCode = code;
    this.emailConfirmationCodeExpire = new Date(Date.now() + 10 * (60 * 1000)); // 10 minutes

    await this.save();

    return code;
  }
}

export default getModelForClass(User);

type RegisterUser = Omit<
  User,
  | "_id"
  | "createdAt"
  | "currentGameID"
  | "gameIDs"
  | "emailConfirmationCode"
  | "emailConfirmed"
  | "resetPasswordToken"
  | "resetPasswordExpire"
  | "matchPasswords"
  | "getResetPasswordToken"
  | "createEmailConfirmationCode"
  | "record"
>;

@InputType()
export class RegisterInput implements RegisterUser {
  @Field()
  public email: string;

  @Field()
  public password: string;

  @Field()
  public firstName: string;

  @Field()
  public lastName: string;

  @Field({ nullable: true })
  public middleName?: string;

  @Field({ nullable: true })
  public company?: string;

  @Field({ nullable: true })
  public position?: string;

  @Field({ nullable: true })
  public foundBy?: string;

  @Field({ nullable: true })
  public profilePic?: string;
}

@InputType()
export class UpdateInput {
  @Field({ nullable: true })
  public firstName?: string;

  @Field({ nullable: true })
  public lastName?: string;

  @Field({ nullable: true })
  public middleName?: string;

  @Field({ nullable: true })
  public company?: string;

  @Field({ nullable: true })
  public position?: string;
}

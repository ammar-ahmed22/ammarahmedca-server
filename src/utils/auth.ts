import jwt from "jsonwebtoken";
import { AuthChecker, ObjectType, Field } from "type-graphql";

export const authChecker: AuthChecker<Context> = ({ context }): boolean =>
  !!context.userId;

const createJWT = (payload: string | object | Buffer): string => {
  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: "1 year",
  });
};

@ObjectType({ description: "Authorized mutations response." })
export class AuthPayload {
  @Field({ description: "JWT (json web token)" })
  public token: string;

  constructor(payload: string | object | Buffer) {
    this.token = createJWT(payload);
  }
}

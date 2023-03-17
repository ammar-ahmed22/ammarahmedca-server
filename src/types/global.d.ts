import { AnyKeys, AnyObject } from "mongoose";
export {};

declare global {
  // MONGOOSE
  type BaseDoc<T> = AnyKeys<T> & AnyObject;
}

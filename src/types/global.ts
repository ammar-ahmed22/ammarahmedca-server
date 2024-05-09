import { AnyKeys, AnyObject } from "mongoose";
// export {};

// declare global {
// MONGOOSE
export type BaseDoc<T> = AnyKeys<T> & AnyObject;
// }

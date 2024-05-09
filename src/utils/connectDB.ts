import mongoose from "mongoose";

export const connect = async (uri: string) => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  console.log("🌿 Connected to MongoDB");
};

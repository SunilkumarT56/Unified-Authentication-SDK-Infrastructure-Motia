// step2-store-user.ts
import { EventConfig, Handlers } from "motia";
import User from "../db/mongoose/User.model";
import connectDB from "../db/db";

export const config: EventConfig = {
  name: "store-user-db",
  type: "event",
  subscribes: ["store-user-db"],
  emits: ["store-user-db"],
};

export const handler: Handlers["store-user-db"] = async (
  input: any,
  { state, logger, emit }: any
) => {
  try {
    await connectDB();

    const { email } = input;
    const userObj = await state.get(`user:${email}`, "signup");

    if (!userObj) {
      logger.error("Store user: No signup data found");
      return;
    }

    const user = new User(userObj);
    await user.save();

    logger.info("User stored:", { email });
    await state.set(`userid:${email}`, "signup", user._id.toString());
  } catch (error) {
    logger.error("Error storing user", { error });
  }
};

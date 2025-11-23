import { EventConfig, Handlers } from "motia";
import User from "../db/mongoose/User.model";
import connectDB from "../db/db";


export const config: EventConfig = {
  name: "send-verify-email",
  type: "event",
  subscribes: ["send-email"],
  emits: ["email-sent"],
};

export const handler = async (input: any, { state, logger }: any) => {
  await connectDB();
  try {
    const { email, tokenHash, userId } = input;
    logger.info("Sending verification email", { email });
    const user = await User.findOne({ email });
     if (!user) {
      return {
        status: 404,
        body: {
          success: false,
          message: "User not found",
        },
      };
    }
    user.emailVerified = true;
    await user.save();
    
    //send the email for the particular user's email
    // change the verifyEmail to true
  } catch (error) {
    logger.error("Error sending verification email", { error });
  }
};

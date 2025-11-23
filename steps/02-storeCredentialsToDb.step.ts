import { EventConfig, Handlers, Event } from "motia";
import User from "../db/mongoose/User.model";
import connectDB from "../db/db";
import dotenv from "dotenv";
dotenv.config();

export const config: EventConfig = {
  name: "store-credentials-to-db",
  type: "event",
  subscribes: ["credentials-submitted-signup"],
  emits: ["credentials-stored-to-db"],
};

export const handler: Handlers["store-credentials-to-db"] = async (
  input,
  { state, logger }: any
) => {
  try {
    await connectDB();
    logger.info(process.env.MONGO_URI);
    const { jobId } = input;
    const storedData = await state.get(jobId, "signup_jobs");
    const { email, name, hashedPassword } = storedData;
    if (!storedData) {
      logger.error("No data found for job id", { jobId });
      return;
    }
    const user = new User({
      email,
      name,
      password: hashedPassword,
    });

    await user.save();
    logger.info("Credentials stored successfully");

    await state.set(jobId, "signup_jobs", {
      status: "stored to db",
    });
  } catch (error) {
    logger.error("Error storing credentials to db", { error });
  }
};

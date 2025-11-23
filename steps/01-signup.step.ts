// step1-signup.ts
import { ApiRouteConfig, Handlers } from "motia";
import { userSchema } from "../Zod/userSchema";
import { z } from "zod";
import bcrypt from "bcrypt";
import crypto from "crypto";
import connectDB from "../db/db";
import User from "../db/mongoose/User.model";

export const config: ApiRouteConfig = {
  name: "signup",
  type: "api",
  path: "/signup",
  method: "POST",
  emits: ["store-user-db", "store-email-token"],
};

export const handler: Handlers["signup"] = async (
  req: any,
  { emit, logger, state }: any
) => {
  try {
    await connectDB();

    const input = req.body as z.infer<typeof userSchema>;
    const { email, password, name } = input;
    const user = await User.findOne({ email });
    if (user) {
      return {
        status: 400,
        body: {
          success: false,
          message: "User already exists",
        },
      };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const userId = crypto.randomBytes(16).toString("hex");

    const userObj = {
      userId,
      email,
      name,
      passwordHash,
    };

    const emailTokenObj = {
      tokenHash,
      rawToken,
      expiresAt: new Date(Date.now() + 3600 * 1000),
      ipAddress: req.headers["x-forwarded-for"] || req.ip,
      userAgent: req.headers["user-agent"] || "unknown",
      email,
    };

    await state.set(`user:${email}`, "signup", userObj);
    await state.set(`emailToken:${email}`, "signup", emailTokenObj);
    emit({
      topic: "store-user-db",
      data: { email },
    });

    emit({
      topic: "store-email-token",
      data: { email },
    });

    return {
      status: 200,
      body: {
        success: true,
        message: "Signup successful. Verification email will be sent.",
      },
    };
  } catch (error) {
    logger.error("Signup error", { error });
    return {
      status: 500,
      body: { success: false, message: "Internallll error" },
    };
  }
};

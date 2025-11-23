import { ApiRouteConfig, Handlers } from "motia";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import connectDB from "../db/db";

export const config: ApiRouteConfig = {
  name: "submit-credentials",
  type: "api",
  path: "/signup",
  method: "POST",
  emits: ["credentials-submitted-signup"],
};

export const userSchema = z.object({
  name: z
    .string()
    .min(2, "Name must have at least 2 characters")
    .max(50, "Name must not exceed 50 characters")
    .regex(/^[A-Za-z\s]+$/, "Name can only contain letters and spaces"),
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .max(100, "Password is too long"),
});

export const handler: Handlers["submit-credentials"] = async (
  req: any,
  { logger, emit, state }: any
) => {
  try {
    const input = req.body as z.infer<typeof userSchema>;
    const { email, password, name } = input;

    const hashedPassword = await bcrypt.hash(password, 10);

    const jobId = uuidv4();
    const user = {
      email,
      name,
      hashedPassword,
      createdAt: new Date().toISOString(),
      jobId,
      status: "Queued",
    };
    await state.set(jobId, "signup_jobs", user);

    emit({
      topic: "credentials-submitted-signup",
      data: {
        jobId,
        status: "Queued",
      },
    });

    return {
      status: 200,
      body: {
        success: true,
        message: "Signup has been submitted successfully",
        jobId,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error("Validation error", { errors: error.message });
      return {
        status: 400,
        body: {
          success: false,
          message: "Validation failed",
          errors: error.message,
        },
      };
    }

    logger.error("Internal server error", { error });
    return {
      status: 500,
      body: {
        success: false,
        message: "Internal server error",
      },
    };
  }
};

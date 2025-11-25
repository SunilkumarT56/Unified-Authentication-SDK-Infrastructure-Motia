import { ApiRouteConfig, Handlers } from "motia";
import User from "../db/mongoose/User.model";
import bcrypt from "bcrypt";

export const config: ApiRouteConfig = {
  name: "signin",
  type: "api",
  path: "/signin",
  method: "POST",
  emits: ["user-logged-in"],
};

export const handler: Handlers["signin"] = async (
  req: any,
  { emit, state }: any
) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return {
        status: 400,
        body: { success: false, message: "Email and password are required" },
      };
    }
    const user = await User.findOne({ email });
    if (!user) {
      return {
        status: 400,
        body: { success: false, message: "User not found" },
      };
    }
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return {
        status: 400,
        body: { success: false, message: "Invalid password" },
      };
    }
    await state.set(`user:${email}`, "signin", { email, userId: user._id });
    emit({
      topic: "user-logged-in",
      data: {
        email,
        userId: user._id,
      },
    });
    return {
      status: 200,
      body: { success: true, message: "User logged in successfully" },
    };
  } catch (error) {
    console.error("Error in signin handler:", error);
  }
};

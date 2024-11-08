import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sign } from "@/services/jwtSignVerify";
import { genericError } from "@/app/api/utils/genericError";
import { cookies } from "next/headers";

export const POST = async (request: NextRequest) => {
  try {
    const bodyJson = await request.json();
    const { username, password } = bodyJson;

    const user = await prisma.user.findUnique({
      where: {
        username,
      },
      select: {
        id: true,
        username: true,
        password: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found or password wrong" },
        { status: 404 },
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json(
        { message: "User not found or password wrong" },
        { status: 404 },
      );
    }

    const token = await sign(
      { userId: user.id },
      process.env.JWT_SECRET as string,
    );

    const { password: _, ...userWithoutPassword } = user;

    cookies().set("token", token, {
      path: "/",
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    cookies().set("user", JSON.stringify(userWithoutPassword), {
      path: "/",
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    return genericError(error);
  }
};

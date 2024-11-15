import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sign, verify } from "@/services/jwtSignVerify";
import { genericError } from "@/app/api/utils/genericError";
import { cookies } from "next/headers";

export const POST = async (request: NextRequest) => {
  try {
    const bodyJson = await request.json();
    const { email, password } = bodyJson;

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        email: true,
        password: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Usuário não encontrado ou senha incorreta" },
        { status: 404 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json(
        { message: "Usuário não encontrado ou senha incorreta" },
        { status: 404 }
      );
    }

    // Gere o access token com tempo de expiração curto
    const accessToken = await sign({ userId: user.id }, process.env.JWT_SECRET as string, {
      expiresIn: "15min",
    });

    // Gere o refresh token com tempo de expiração mais longo
    const refreshToken = await sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET as string, {
      expiresIn: "7d",
    });

    const { password: _, ...userWithoutPassword } = user;

    // Armazene o access token em um cookie HttpOnly
    cookies().set("accessToken", accessToken, {
      path: "/",
      httpOnly: true,
      maxAge: 15 * 60, // 15 minutos em segundos
    });

    cookies().set("user", JSON.stringify(userWithoutPassword), {
      path: "/",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60, // 7 dias em segundos
    });

    // Armazene o refresh token em um cookie HttpOnly
    cookies().set("refreshToken", refreshToken, {
      path: "/",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60, // 7 dias em segundos
    });

    // Retorne os dados do usuário (sem a senha)
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    return genericError(error);
  }
};

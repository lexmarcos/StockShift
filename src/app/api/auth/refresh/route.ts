import { NextRequest, NextResponse } from "next/server";
import { verify, sign } from "@/services/jwtSignVerify";
import { cookies } from "next/headers";

export const POST = async (request: NextRequest) => {
  try {
    const refreshToken = cookies().get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { message: "Refresh token não encontrado" },
        { status: 401 },
      );
    }
    const payload = await verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET as string,
    );

    const userId = payload.userId;

    const newAccessToken = await sign(
      { userId },
      process.env.JWT_SECRET as string,
      { expiresIn: "15min" },
    );

    cookies().set("accessToken", newAccessToken, {
      path: "/",
      httpOnly: true,
      maxAge: 15 * 60,
    });

    return NextResponse.json({ message: "Access token renovado" });
  } catch (error) {
    return NextResponse.json(
      { message: "Refresh token inválido ou expirado" },
      { status: 401 },
    );
  }
};
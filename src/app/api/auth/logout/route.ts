import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const doLogout = async (request: NextRequest) => {
  cookies().delete("token");
  cookies().delete("user");

  return NextResponse.redirect(new URL("/auth/signin", request.url));
};

export const POST = async (request: NextRequest) => {
  cookies().delete("token");
  cookies().delete("user");

  return NextResponse.json({ message: "Logout efetuado com sucesso" }, { status: 200 });
};

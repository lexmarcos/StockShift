import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET as string;

export function redirect(pathToRedirect: string, lastUrl: string) {
  return NextResponse.redirect(new URL(pathToRedirect, lastUrl));
}

export function unauthorizedResponse() {
  return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
}
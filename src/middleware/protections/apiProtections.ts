import { NextResponse } from "next/server";
import { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { verify } from "@/services/jwtSignVerify";
import { unauthorizedResponse } from "../utils/utils";

const JWT_SECRET = process.env.JWT_SECRET as string;

async function handleTokenValidation(token: string): Promise<void | NextResponse> {
  try {
    await verify(token, JWT_SECRET);
  } catch (error) {
    return unauthorizedResponse();
  }
}

export async function apiProtections(token: string | undefined) {
  if (!token) {
    return unauthorizedResponse();
  }
  const tokenValidationResponse = await handleTokenValidation(token);
  if (tokenValidationResponse) return tokenValidationResponse;

  return NextResponse.next();
}

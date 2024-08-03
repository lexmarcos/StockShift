import { ZodError } from "zod";
import { generateZodErrorMessage } from "./zodError";
import { NextResponse } from "next/server";

export const genericError = (error: any) => {
  if (error instanceof ZodError) {
    return generateZodErrorMessage(error);
  }
  return new NextResponse(error, { status: 500 });
};

export const noUserError = () => {
  return NextResponse.json({ message: "User not found" }, { status: 404 });
};

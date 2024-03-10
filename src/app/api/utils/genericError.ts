
import { ZodError } from "zod";
import { generateZodErrorMessage } from "./zodError";
import { NextResponse } from "next/server";

export const genericError = (error: any) => {
  if (error instanceof ZodError) {
    return generateZodErrorMessage(error);
  }
  return new NextResponse("Internal Server Error", { status: 500 });
};

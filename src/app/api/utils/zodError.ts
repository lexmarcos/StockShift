import { NextResponse } from "next/server";
import { ZodError } from "zod";

export const generateZodErrorMessage = (error: ZodError) => {
  const formattedErrors = error.errors.map((err) => ({
    path: err.path.join("."),
    message: err.message,
  }));
  return new NextResponse(JSON.stringify({ errors: formattedErrors }), {
    status: 400,
  });
};

import { NextRequest, NextResponse } from "next/server";
import { genericError } from "@/app/api/utils/genericError";
import prisma from "@/lib/prisma";

export const POST = async (request: NextRequest) => {
  try {
    const bodyJson = await request.json();
    //todo adicionar validador zod
    const validated = bodyJson;

    const result = await prisma.category.create({
      data: validated,
    });
    return NextResponse.json(result);
  } catch (error) {
    return genericError(error);
  }
};

export const GET = async (request: NextRequest) => {
  try {
    const result = await prisma.category.findMany({
      include: {
        products: false,
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    return genericError(error);
  }
};

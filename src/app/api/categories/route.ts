import { NextRequest, NextResponse } from "next/server";
import { genericError } from "@/app/api/utils/genericError";
import prisma from "@/lib/prisma";
import {
  CategoryOptionalDefaultsSchema,
  CategorySchema,
} from "../../../../prisma/generated/zod";

export const POST = async (request: NextRequest) => {
  try {
    const bodyJson = await request.json();
    const validated = CategoryOptionalDefaultsSchema.parse(bodyJson);

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

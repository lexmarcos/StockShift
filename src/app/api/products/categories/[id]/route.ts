import { NextRequest, NextResponse } from "next/server";
import { genericError } from "../../../utils/genericError";
import prisma from "@/lib/prisma";
import { IParamsWithId } from "@/app/api/utils/genericTypes";

export const GET = async (request: NextRequest, { params }: IParamsWithId) => {
  const id = params.id;

  if (!id)
    return NextResponse.json(
      {
        message: "id of a category is required",
      },
      { status: 400 }
    );

  try {
    const products = await prisma.product.findMany({
      where: {
        categoryIDs: {
          hasSome: [id],
        },
      },
      include: {
        categories: true,
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    return genericError(error);
  }
};

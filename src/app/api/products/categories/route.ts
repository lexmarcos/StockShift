import { NextResponse } from "next/server";
import { genericError } from "../../utils/genericError";
import prisma from "@/lib/prisma";

export const GET = async () => {
  try {
    const products = await prisma.product.findMany({
      where: {
        categoryIDs: {
          hasSome: ["66077d4d0418e01513962227"],
        },
      },
      include: {
        categories: true,
      }
    });

    return NextResponse.json(products);
  } catch (error) {
    return genericError(error);
  }
};

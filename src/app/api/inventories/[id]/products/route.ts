import { getUserByCookie } from "@/app/api/utils/cookies";
import { genericError } from "@/app/api/utils/genericError";
import { IParamsWithId } from "@/app/api/utils/genericTypes";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (request: NextRequest, { params }: IParamsWithId) => {
  try {
    const user = getUserByCookie();
    console.log(params);
    const idOfInventory = params.id;

    const inventory = await prisma.inventory.findFirst({
      where: {
        id: idOfInventory,
        userIDs: { has: user.id },
      },
    });

    if (!inventory) {
      throw new Error("Usuário não tem permissão para acessar este inventário.");
    }
    const productCount = await prisma.product.count({
      where: {
        inventoryId: idOfInventory,
      },
    });

    return NextResponse.json({ productCount });
  } catch (error) {
    return genericError(error);
  }
};

import { genericError } from "@/app/api/utils/genericError";
import { IParamsWithId } from "@/app/api/utils/genericTypes";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getUserByCookie } from "@/app/api/utils/cookies";

export const PUT = async (request: NextRequest, { params }: IParamsWithId) => {
  const idOfInventory = params.id;
  try {
    if (!idOfInventory) {
      return NextResponse.json(
        { message: "Inventory ID is required" },
        {
          status: 400,
        },
      );
    }

    const user = getUserByCookie();

    if (!user) {
      return NextResponse.json(
        { message: "User or inventory not found" },
        {
          status: 404,
        },
      );
    }

    const inventory = await prisma.inventory.findUnique({
      where: {
        id: idOfInventory,
        users: {
          some: {
            id: user.id,
          },
        },
      },
    });

    if (!inventory) {
      return NextResponse.json(
        { message: "User or inventory not found" },
        {
          status: 404,
        },
      );
    }

    cookies().set(
      "user",
      JSON.stringify({ ...user, inventoryId: idOfInventory }),
    );

    return NextResponse.json(inventory);
  } catch (error) {
    return genericError(error);
  }
};

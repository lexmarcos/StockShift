import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { genericError } from "../../utils/genericError";

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { email, inventoryId } = body;

    if (!email) {
      return NextResponse.json(
        {
          message: "Email is required",
        },
        {
          status: 400,
        },
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    const updatedInventory = await prisma.inventory.update({
      where: {
        id: inventoryId,
      },
      data: {
        users: {
          connect: {
            email,
          },
        },
      },
    });

    return NextResponse.json(updatedInventory);
  } catch (error) {
    return genericError(error);
  }
};

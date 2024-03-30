import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { genericError } from "../../utils/genericError";

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const idOfInventory = body.id;

    if (!idOfInventory) {
      return NextResponse.json(
        { message: "Inventory ID is required" },
        {
          status: 400,
        }
      );
    }

    const user = JSON.parse(cookies().get("user")?.value || "");

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        {
          status: 404,
        }
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
        { message: "Inventory not found" },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(inventory);
  } catch (error) {
    return genericError(error);
  }
};

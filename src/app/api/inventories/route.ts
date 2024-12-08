import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { genericError } from "../utils/genericError";
import { cookies } from "next/headers";

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    // todo adicionar validador zod
    const validatedBody = body;

    const user = JSON.parse(cookies().get("user")?.value as string);

    const result = await prisma.inventory.create({
      data: {
        ...validatedBody,
        users: { connect: { id: user.id } },
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    return genericError(error);
  }
};

export const GET = async () => {
  try {
    const user = JSON.parse(cookies().get("user")?.value as string);

    const inventories = await prisma.inventory.findMany({
      where: {
        users: {
          some: {
            id: user.id,
          },
        },
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    return NextResponse.json(inventories);
  } catch (error) {
    return genericError(error);
  }
};

export const DELETE = async (request: NextRequest) => {
  try {
    const { id } = await request.json();
    const inventoryId = id as string;

    const inventory = await prisma.inventory.delete({
      where: {
        id: inventoryId,
      },
    });

    return NextResponse.json(inventory);
  } catch (error) {
    return genericError(error);
  }
};

export const PUT = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const validatedBody = body;

    const inventoryId = body.id as string;

    const inventory = await prisma.inventory.update({
      where: {
        id: inventoryId,
      },
      data: validatedBody,
    });

    return NextResponse.json(inventory);
  } catch (error) {
    return genericError(error);
  }
};

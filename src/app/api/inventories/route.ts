import { NextRequest, NextResponse } from "next/server";
import { InventoryOptionalDefaultsSchema } from "../../../../prisma/generated/zod";
import prisma from "@/lib/prisma";
import { genericError } from "../utils/genericError";

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const validatedBody = InventoryOptionalDefaultsSchema.parse(body);

    const result = await prisma.inventory.create({
      data: validatedBody,
    });
    return NextResponse.json(result);
  } catch (error) {
    return genericError(error);
  }
};

export const GET = async () => {
  try {
    const inventories = await prisma.inventory.findMany();
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
    const validatedBody = InventoryOptionalDefaultsSchema.parse(body);

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

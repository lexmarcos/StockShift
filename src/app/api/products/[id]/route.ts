import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { IParamsWithId } from "../../utils/genericTypes";

export const GET = async (req: NextRequest, { params }: IParamsWithId) => {
  const id = params.id;

  if (!id)
    return NextResponse.json(
      {
        message: "id is required",
      },
      { status: 400 },
    );

  const product = await prisma.product.findUnique({ where: { id } });

  return NextResponse.json(product);
};

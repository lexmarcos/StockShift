import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

interface IParamsSKU {
  params: { sku: string };
}

export const GET = async (req: NextRequest, { params }: IParamsSKU) => {
  const sku= params.sku;

  if (!sku)
    return NextResponse.json(
      {
        message: "id is required",
      },
      { status: 400 }
    );

  const product = await prisma.product.findFirst({ where: { sku } });

  return NextResponse.json(product);
};

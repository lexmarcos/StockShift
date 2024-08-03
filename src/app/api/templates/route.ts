import { NextRequest } from "next/server";
import { ProductTemplateOptionalDefaultsSchema } from "../../../../prisma/generated/zod";
import prisma from "@/lib/prisma";
import { genericError } from "@/app/api/utils/genericError";

declare global {
  namespace PrismaJson {
    type ISpecifcAttributes = {
      label: string;
      type: string;
    }[];
  }
}

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const validatedBody = ProductTemplateOptionalDefaultsSchema.parse(body);

    return prisma.productTemplate.create({
      data: {
        ...validatedBody,
      },
    });
  } catch (error) {
    return genericError(error);
  }
};

export const GET = async (request: NextRequest) => {
  try {
    return prisma.productTemplate.findMany();
  } catch (error) {
    return genericError(error);
  }
};

export const PUT = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const validatedBody = ProductTemplateOptionalDefaultsSchema.parse(body);
    const { id, ...rest } = validatedBody;

    return prisma.productTemplate.update({
      where: {
        id,
      },
      data: rest,
    });
  } catch (error) {
    return genericError(error);
  }
};

export const DELETE = async (request: NextRequest) => {
  const body = await request.json();

  return prisma.productTemplate.delete({
    where: {
      id: body.id,
    },
  });
};

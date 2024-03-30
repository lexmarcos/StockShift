import { NextRequest, NextResponse } from "next/server";
import { uploadToBucket } from "@/lib/cloudinary";
import prisma from "@/lib/prisma";

import { genericError } from "../utils/genericError";
import { Product, ProductOptionalDefaultsSchema } from "../../../../prisma/generated/zod";

export const getAllProducts = async () => {
  return await prisma.product.findMany({
    include: {
      categories: true,
      Inventory: true,
    },
  });
};

export const GET = async () => {
  try {
    const products = await getAllProducts();

    return NextResponse.json(products);
  } catch (error) {
    return genericError(error);
  }
};

export const createProduct = async (data: Product) => {
  const imageToUpload = data.imageUrl;
  const productValidated = ProductOptionalDefaultsSchema.parse(data);

  let imageUrl = "";
  if (imageToUpload) {
    imageUrl = await uploadToBucket(imageToUpload as string, productValidated.name as string);
  }

  const productToAdd = {
    ...productValidated,
    imageUrl,
  };

  return await prisma.product.create({
    data: {
      ...productToAdd,
      categories: {
        connect: productToAdd.categoryIDs?.map((id) => ({ id })),
      },
    },
  });
};

export const POST = async (request: NextRequest) => {
  try {
    const bodyJson = await request.json();
    const result = createProduct(bodyJson);

    return NextResponse.json(result);
  } catch (error) {
    return genericError(error);
  }
};

export const DELETE = async (request: NextRequest) => {
  try {
    const { id } = await request.json();

    const result = await prisma.product.delete({
      where: {
        id: id as string,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    return genericError(error);
  }
};

export const PUT = async (request: NextRequest) => {
  try {
    const bodyJson = await request.json();
    const productValidated = ProductOptionalDefaultsSchema.parse(bodyJson);
    const { id, ...rest } = productValidated;

    const result = await prisma.product.update({
      where: {
        id: bodyJson.id as string,
      },
      data: rest,
    });

    return NextResponse.json(result);
  } catch (error) {
    return genericError(error);
  }
};

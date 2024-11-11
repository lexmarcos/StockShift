import { NextRequest, NextResponse } from "next/server";
import { uploadToBucket } from "@/lib/cloudinary";
import prisma from "@/lib/prisma";

import { genericError, noUserError } from "../utils/genericError";
import { IUserCookie, getUserByCookie } from "../utils/cookies";
import { Product } from "@prisma/client";

export const getAllProducts = async () => {
  return prisma.product.findMany({
    include: {
      categories: true,
      Inventory: true,
    },
    where: {
      userId: getUserByCookie().id,
      inventoryId: getUserByCookie().inventoryId,
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

export const createProduct = async (
  product: Product,
  user: IUserCookie,
) => {
  const imageToUpload = product.imageUrl;

  let imageUrl = "";
  if (imageToUpload) {
    imageUrl = await uploadToBucket(
      imageToUpload as string,
      product.name as string,
    );
  }

  const productToAdd = {
    ...product,
    imageUrl,
  };

  return prisma.product.create({
    data: {
      ...productToAdd,
      categories: {
        connect: productToAdd.categoryIDs?.map((id) => ({ id })),
      },
      userId: user.id,
      inventoryId: user.inventoryId,
    },
  });
};

export const POST = async (request: NextRequest) => {
  try {
    const bodyJson = await request.json();
    const user = getUserByCookie();

    if (!user) {
      return noUserError();
    }

    // todo adicionar validador zod
    const product = bodyJson

    const result = createProduct(product, user);

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
    // todo adicionar validador zod
    const productValidated = bodyJson;
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

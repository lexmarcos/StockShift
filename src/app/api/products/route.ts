import { NextRequest, NextResponse } from "next/server";
import { ProductCreateInputObjectSchema } from "../../../../prisma/generated/schemas";
import { uploadToBucket } from "@/lib/cloudinary";
import prisma from "@/lib/prisma";
import { genericError } from "../utils/genericError";

export const getAllProducts = async () => {
  return await prisma.product.findMany();
};

export const GET = async () => {
  try {
    const products = await getAllProducts();

    return NextResponse.json(products);
  } catch (error) {
    return genericError(error);
  }
};

export const POST = async (request: NextRequest) => {
  try {
    const bodyJson = await request.json();
    const imageToUpload = bodyJson.imageUrl;
    const productValidated = ProductCreateInputObjectSchema.parse(bodyJson);

    const imageUrl = await uploadToBucket(imageToUpload, productValidated.name as string);

    const productToAdd = {
      ...productValidated,
      imageUrl,
    };

    const result = await prisma.product.create({
      data: productToAdd,
    });

    console.log(result);

    return NextResponse.json(result);
  } catch (error) {
    return genericError(error);
  }
};

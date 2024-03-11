import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { genericError } from "@/app/api/utils/genericError";
import { UserCreateInputObjectSchema } from "../../../../prisma/generated/schemas";

const generatePasswordHash = async (password: string) => {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
};

export const POST = async (request: NextRequest) => {
  try {
    const bodyJson = await request.json();
    const { username, password, email, name } = UserCreateInputObjectSchema.parse(bodyJson);
    const hashedPassword = await generatePasswordHash(password);

    const result = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        username,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    return genericError(error);
  }
};

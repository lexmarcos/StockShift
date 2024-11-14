import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { genericError } from "@/app/api/utils/genericError";

const generatePasswordHash = async (password: string) => {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
};

export const POST = async (request: NextRequest) => {
  try {
    const bodyJson = await request.json();
    // todo adicionar validador zod
    const { password, email, name } = bodyJson;
    const hashedPassword = await generatePasswordHash(password);

    const result = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });

    return NextResponse.json({ message: "Usuário criado com sucesso" }, { status: 201 });
  } catch (error) {
    return genericError(error);
  }
};

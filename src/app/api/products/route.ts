import { NextResponse } from "next/server";

export const GET = async () => {
  const response = await fetch("https://jsonplaceholder.typicode.com/posts");
  const data = await response.json();
  return NextResponse.json(data);
};

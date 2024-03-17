import { NextRequest, NextResponse } from "next/server";
import { verify } from "./app/services/jwtSignVerify";
import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";

// const ratelimit = new Ratelimit({
//   redis: kv,
//   // 5 requests from the same IP in 10 seconds
//   limiter: Ratelimit.slidingWindow(5, "10 s"),
// });

export const middleware = async (req: NextRequest) => {
  // const ip = req.ip ?? "127.0.0.1";
  // const { success, pending, limit, reset, remaining } = await ratelimit.limit(ip);
  // console.log({ success, pending, limit, reset, remaining });
  // if (!success) {
  //   return NextResponse.redirect(new URL("/blocked", req.url));
  // }
  const token = req.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.json({ message: "No token provided" }, { status: 401 });
  }
  try {
    await verify(token, process.env.JWT_SECRET as string);
    return NextResponse.next();
  } catch (error) {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }
};

export const config = {
  matcher: "/api/:path*",
};

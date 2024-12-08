import { NextRequest } from "next/server";
import { routesProtections } from "./protections/routeProtections";
import { apiProtections } from "./protections/apiProtections";

export const coreMiddleware = async (req: NextRequest) => {
  const token =
    req.cookies.get("accessToken")?.value ||
    req.headers.get("Authorization")?.replace("Bearer ", "");

  const pathname = req.nextUrl.pathname;

  if (!pathname.startsWith("/api")) {
    return routesProtections(req, token, pathname);
  }

  return apiProtections(token);
};

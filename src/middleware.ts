import { NextRequest } from "next/server";
import { coreMiddleware } from "./middleware/middleware";

export const middleware = async (req: NextRequest) => {
  return coreMiddleware(req);
};

export const config = {
  matcher: "/((?!_next|fonts|api/auth|examples|[\\w-]+\\.\\w+).*)",
};

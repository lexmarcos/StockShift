import { NextRequest, NextResponse } from "next/server";
import { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { redirect, unauthorizedResponse } from "../utils/utils";
import { getUserByCookie } from "@/app/api/utils/cookies";

function blockPagesOfUsersWithoutToken(req: NextRequest, pathname: string) {
  const isSigninPage = pathname.startsWith("/auth/signin");
  if (isSigninPage) return NextResponse.next();
  return redirect("/auth/signin", req.url);
}

function blockSigninPageOfUsersAlreadyAuthorized(req: NextRequest) {
  const user = getUserByCookie();
  if (!user) return unauthorizedResponse();

  const redirectUrl = user.inventoryId ? "/dashboard" : "/inventories";
  return redirect(redirectUrl, req.url);
}

function blockInventoryPagesOfUsersWithoutSelectedInventory(req: NextRequest) {
  const user = getUserByCookie();
  if (!user) return unauthorizedResponse();

  if (!user.inventoryId) return redirect("/inventories", req.url);
}

export async function routesProtections(
  req: NextRequest,
  token: string | undefined,
  pathname: string
) {
  if (!token) {
    return blockPagesOfUsersWithoutToken(req, pathname);
  }

  if (pathname.startsWith("/auth/signin")) {
    return blockSigninPageOfUsersAlreadyAuthorized(req);
  }

  if (!pathname.startsWith("/inventories")) {
    return blockInventoryPagesOfUsersWithoutSelectedInventory(req);
  }

  return NextResponse.next();
}

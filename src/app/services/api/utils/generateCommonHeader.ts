import { cookies } from "next/headers";

export const commonHeaders = new Headers();
commonHeaders.append("Cookie", `token=${cookies().get("token")?.value}`);

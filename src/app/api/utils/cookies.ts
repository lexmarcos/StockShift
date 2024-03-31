import { cookies } from "next/headers";

export const getUserByCookie = () => {
  const userOfCookie = cookies().get("user")?.value as string;
  if (!userOfCookie) return {};

  const user = JSON.parse(userOfCookie);

  return user;
};

import { cookies } from "next/headers";

export const getUserByCookie = () => {
  const user = JSON.parse(cookies().get("user")?.value as string);

  return user;
};

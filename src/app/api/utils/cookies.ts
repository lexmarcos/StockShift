import { cookies } from "next/headers";

export interface IUserCookie {
  id: string;
  username: string;
  inventoryId: string;
}

export const getUserByCookie = (): IUserCookie => {
  const userOfCookie = cookies().get("user")?.value as string;
  if (!userOfCookie) return {} as IUserCookie;

  const user = JSON.parse(userOfCookie);

  return user;
};

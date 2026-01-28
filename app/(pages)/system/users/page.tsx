"use client";

import { useUsersModel } from "./users.model";
import { UsersView } from "./users.view";

export default function UsersPage() {
  const model = useUsersModel();

  return <UsersView {...model} />;
}

"use client";

import { useHeaderModel } from "./header.model";
import { HeaderView } from "./header.view";

export const Header = () => {
  const model = useHeaderModel();
  return <HeaderView {...model} />;
};

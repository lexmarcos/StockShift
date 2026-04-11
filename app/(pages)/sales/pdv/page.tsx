"use client";

import { usePdvModel } from "./pdv.model";
import { PdvView } from "./pdv.view";

export default function PdvPage() {
  const model = usePdvModel();
  return <PdvView {...model} />;
}

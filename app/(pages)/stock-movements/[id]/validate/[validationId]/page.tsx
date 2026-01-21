"use client";

import { useParams } from "next/navigation";
import { useValidationModel } from "./validation.model";
import { ValidationView } from "./validation.view";

export default function ValidationPage() {
  const params = useParams();
  const movementId = params.id as string;
  const validationId = params.validationId as string;

  const model = useValidationModel(movementId, validationId);

  if (model.error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A]">
        <div className="text-center">
          <p className="text-sm text-rose-500">Erro ao carregar validação</p>
          <button
            onClick={model.onBack}
            className="mt-4 text-xs text-neutral-400 underline"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return <ValidationView {...model} />;
}

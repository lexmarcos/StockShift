export function shouldRegisterServiceWorker(
  nodeEnv: string | undefined,
  hasServiceWorker: boolean,
): boolean {
  return nodeEnv === "production" && hasServiceWorker;
}

export const NEW_VERSION_MESSAGE = "Nova versão disponível";
export const UPDATE_ACTION_LABEL = "Atualizar";

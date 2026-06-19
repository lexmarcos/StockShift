import type { Metadata } from "next";
import { WifiOff } from "lucide-react";

export const metadata: Metadata = {
  title: "Offline",
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <WifiOff className="h-12 w-12 text-neutral-500" strokeWidth={2} />
      <h1 className="text-2xl font-bold">Você está offline</h1>
      <p className="max-w-sm text-neutral-400">
        Não foi possível conectar ao StockShift. Verifique sua conexão e tente
        novamente.
      </p>
    </main>
  );
}

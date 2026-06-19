"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import {
  NEW_VERSION_MESSAGE,
  UPDATE_ACTION_LABEL,
  shouldRegisterServiceWorker,
} from "@/lib/pwa/service-worker-registration";

export function ServiceWorkerProvider(): null {
  useEffect(() => {
    if (
      !shouldRegisterServiceWorker(
        process.env.NODE_ENV,
        "serviceWorker" in navigator,
      )
    ) {
      return;
    }

    // controllerchange also fires on the first install, since sw.js calls
    // clients.claim() on activate. Reloading on every change would reload the
    // page during a user's first visit and discard whatever they were doing,
    // so only reload once this tab's user has accepted an update via the toast.
    let hasReloaded = false;
    let updateAccepted = false;
    const reloadOnControllerChange = (): void => {
      if (!updateAccepted || hasReloaded) return;
      hasReloaded = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      reloadOnControllerChange,
    );

    const promptUpdate = (worker: ServiceWorker): void => {
      toast(NEW_VERSION_MESSAGE, {
        duration: Infinity,
        action: {
          label: UPDATE_ACTION_LABEL,
          onClick: () => {
            updateAccepted = true;
            worker.postMessage({ type: "SKIP_WAITING" });
          },
        },
      });
    };

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        if (registration.waiting) promptUpdate(registration.waiting);
        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (
              installing.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              promptUpdate(installing);
            }
          });
        });
      })
      .catch((error) => {
        console.error("Falha ao registrar o service worker", error);
      });

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        reloadOnControllerChange,
      );
    };
  }, []);

  return null;
}

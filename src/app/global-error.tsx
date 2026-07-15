"use client";

import { useEffect } from "react";

function shouldReload(error: Error & { digest?: string }) {
  return (
    error.name === "ChunkLoadError" ||
    error.message.includes("ChunkLoadError") ||
    error.message.includes("Loading chunk") ||
    error.message.includes("dynamically imported module")
  );
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (!shouldReload(error)) return;

    const reloadFlag = "aeria_chunk_reload_done";
    if (sessionStorage.getItem(reloadFlag) === "1") return;

    sessionStorage.setItem(reloadFlag, "1");
    window.location.reload();
  }, [error]);

  return (
    <html lang="fr">
      <body>
        <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
          <h1>Une erreur est survenue</h1>
          <p>La page n’a pas pu se charger correctement.</p>
          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem("aeria_chunk_reload_done");
              reset();
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}

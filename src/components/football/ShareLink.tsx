"use client";

import { useEffect, useState } from "react";
import { Link2, Share2 } from "lucide-react";
import { Action } from "@/components/brand/Action";

/**
 * Share this page's own address: the system share sheet where there is one,
 * else a copied link (audit PRO3-15: a club page offered neither, so a
 * Benfica link was passed on as the hub's Porto-led card). The address is the
 * page's own, without the query string, so a link names the club it is about.
 */
export function ShareLink({ title, locale }: { title: string; locale: "pt" | "en" }) {
  const pt = locale === "pt";
  const [canShare, setCanShare] = useState(false);
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}`;
    if (canShare) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    window.setTimeout(() => setStatus("idle"), 2400);
  };

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <Action variant="secondary" onClick={() => void share()}>
        {canShare ? <Share2 aria-hidden="true" className="h-4 w-4" /> : <Link2 aria-hidden="true" className="h-4 w-4" />}
        {canShare ? (pt ? "Partilhar" : "Share") : (pt ? "Copiar link" : "Copy link")}
      </Action>
      <span role="status" className="text-sm text-stone-600">
        {status === "copied"
          ? pt ? "Link copiado." : "Link copied."
          : status === "failed"
            ? pt ? "Não foi possível copiar. Copia o endereço da barra." : "That did not work. Copy the address bar."
            : ""}
      </span>
    </div>
  );
}

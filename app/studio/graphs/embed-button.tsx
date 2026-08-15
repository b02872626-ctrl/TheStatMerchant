"use client";

import { useState } from "react";

export function GraphEmbedButton({ path, height = 560, disabled = false }: { path: string; height?: number; disabled?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copyEmbed() {
    const url = new URL(path, window.location.origin).toString();
    const html = `<iframe src="${url}" title="TheStatMerchant interactive graph" width="100%" height="${height}" loading="lazy" style="border:0;max-width:100%;" allow="fullscreen"></iframe>`;
    try {
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard.write) {
        await navigator.clipboard.write([new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([html], { type: "text/plain" }),
        })]);
      } else {
        await navigator.clipboard.writeText(html);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    }
  }

  return <button type="button" className="graph-embed-button" onClick={copyEmbed} disabled={disabled} title={disabled ? "Select players before creating an embed" : "Copy iframe HTML for this graph"}>
    {copied ? "Copied HTML ✓" : "Copy embed HTML"}
  </button>;
}

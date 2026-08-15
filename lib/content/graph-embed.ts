const GRAPH_PATH = "/embed/graph";

export function normalizeGraphEmbedSrc(input: string, origin?: string) {
  try {
    if (input.startsWith(`${GRAPH_PATH}?`)) return input;
    if (!origin) return null;
    const url = new URL(input, origin);
    if (url.origin !== origin || url.pathname !== GRAPH_PATH) return null;
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

export function graphEmbedMarker(src: string) {
  return `{{graph:${src}}}`;
}

export function parseGraphEmbedBlock(block: string) {
  const marker = block.trim().match(/^\{\{graph:(\/embed\/graph\?[^}\s]+)}}$/);
  if (marker) return normalizeGraphEmbedSrc(marker[1]);

  const iframe = block.trim().match(/^<iframe\b[^>]*\bsrc=["'](\/embed\/graph\?[^"']+)["'][^>]*><\/iframe>$/i);
  return iframe ? normalizeGraphEmbedSrc(iframe[1].replace(/&amp;/g, "&")) : null;
}

export function isRadarEmbed(src: string) {
  return /(?:\?|&)kind=radar(?:&|$)/.test(src);
}

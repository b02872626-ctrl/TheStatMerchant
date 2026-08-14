"use client";

import { upload } from "@vercel/blob/client";
import { type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, useEffect, useLayoutEffect, useRef, useState } from "react";

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function inlineHtml(value: string) {
  return escapeHtml(value)
    .replace(/\[([^\]]+)]\((https:\/\/[^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_\n]+)__/g, "<strong>$1</strong>")
    .replace(/\+\+([^+\n]+)\+\+/g, "<u>$1</u>")
    .replace(/~~([^~\n]+)~~/g, "<s>$1</s>")
    .replace(/`([^`\n]+)`/g, "<code>$1</code>")
    .replace(/\*([^*\n]+)\*/g, "<em>$1</em>")
    .replace(/_([^_\n]+)_/g, "<em>$1</em>")
    .replace(/\n/g, "<br>");
}

function tableCells(line: string) {
  return line.trim().replace(/^\||\|$/g, "").split("|").map(cell => cell.trim());
}

function isTable(block: string) {
  const lines = block.split("\n").filter(Boolean);
  return lines.length >= 2 && lines[0].includes("|") && /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(lines[1]);
}

function bodyToHtml(body: string) {
  return body.split(/\n\n+/).filter(Boolean).map(block => {
    const image = block.match(/^!\[(.*)]\((https:\/\/[^)]+)\)$/);
    const lines = block.split("\n");
    if (block.startsWith("## ")) return `<h2>${inlineHtml(block.slice(3))}</h2>`;
    if (block.startsWith("> ")) return `<blockquote class="quote">${inlineHtml(block.slice(2))}</blockquote>`;
    if (block === "---") return "<hr>";
    if (image) return `<figure class="body-image-wrap"><img class="body-image" src="${escapeHtml(image[2])}" alt="${escapeHtml(image[1] || "Article image")}"><figcaption>${escapeHtml(image[1])}</figcaption></figure>`;
    if (isTable(block)) {
      const headers = tableCells(lines[0]);
      const rows = lines.slice(2).map(tableCells);
      return `<div class="article-table-wrap"><table class="article-table"><thead><tr>${headers.map(cell => `<th>${inlineHtml(cell)}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr>${headers.map((_, index) => `<td>${inlineHtml(row[index] ?? "")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    }
    if (lines.every(line => /^-\s+/.test(line))) return `<ul>${lines.map(line => `<li>${inlineHtml(line.replace(/^-\s+/, ""))}</li>`).join("")}</ul>`;
    if (lines.every(line => /^\d+\.\s+/.test(line))) return `<ol>${lines.map(line => `<li>${inlineHtml(line.replace(/^\d+\.\s+/, ""))}</li>`).join("")}</ol>`;
    return `<p>${inlineHtml(block)}</p>`;
  }).join("");
}

function inlineMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
  if (!(node instanceof HTMLElement)) return "";
  const content = Array.from(node.childNodes).map(inlineMarkdown).join("");
  const tag = node.tagName.toLowerCase();
  if (tag === "strong" || tag === "b") return `**${content}**`;
  if (tag === "em" || tag === "i") return `*${content}*`;
  if (tag === "u") return `++${content}++`;
  if (tag === "s" || tag === "strike") return `~~${content}~~`;
  if (tag === "code") return `\`${content}\``;
  if (tag === "a") return `[${content}](${node.getAttribute("href") ?? ""})`;
  if (tag === "br") return "\n";
  return content;
}

function editorToBody(editor: HTMLElement) {
  const blocks = Array.from(editor.childNodes).map(node => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent?.trim() ?? "";
    if (!(node instanceof HTMLElement)) return "";
    const tag = node.tagName.toLowerCase();
    if (tag === "h2") return `## ${inlineMarkdown(node)}`;
    if (tag === "blockquote") return `> ${inlineMarkdown(node)}`;
    if (tag === "hr") return "---";
    if (tag === "figure") {
      const image = node.querySelector("img");
      const caption = node.querySelector("figcaption")?.textContent?.trim() || image?.getAttribute("alt") || "";
      return image?.getAttribute("src") ? `![${caption}](${image.getAttribute("src")})` : "";
    }
    if (tag === "ul" || tag === "ol") {
      return Array.from(node.querySelectorAll(":scope > li")).map((item, index) => `${tag === "ul" ? "-" : `${index + 1}.`} ${inlineMarkdown(item)}`).join("\n");
    }
    const table = tag === "table" ? node : node.querySelector(":scope > table");
    if (table) {
      const rows = Array.from(table.querySelectorAll("tr")).map(row => Array.from(row.querySelectorAll("th,td")).map(cell => inlineMarkdown(cell).replace(/\|/g, "\\|").trim()));
      if (!rows.length) return "";
      const divider = rows[0].map(() => "---");
      return [rows[0], divider, ...rows.slice(1)].map(row => `| ${row.join(" | ")} |`).join("\n");
    }
    return inlineMarkdown(node).trim();
  });
  return blocks.filter(Boolean).join("\n\n");
}

type Props = {
  body: string;
  disabled?: boolean;
  onChange: (body: string) => void;
  onError: (message: string) => void;
  onUploadingChange: (uploading: boolean) => void;
};

export default function RichStoryEditor({body, disabled = false, onChange, onError, onUploadingChange}: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [initialHtml] = useState(() => bodyToHtml(body));
  const [uploading, setUploading] = useState(false);

  const rememberSelection = () => {
    const selection = window.getSelection();
    if (selection?.rangeCount && editorRef.current?.contains(selection.anchorNode)) savedRangeRef.current = selection.getRangeAt(0).cloneRange();
  };

  useEffect(() => {
    const trackSelection = () => {
      const selection = window.getSelection();
      if (selection?.rangeCount && !selection.isCollapsed && editorRef.current?.contains(selection.anchorNode)) savedRangeRef.current = selection.getRangeAt(0).cloneRange();
    };
    document.addEventListener("selectionchange", trackSelection);
    return () => document.removeEventListener("selectionchange", trackSelection);
  }, []);

  useLayoutEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = initialHtml;
  }, [initialHtml]);
  const syncBody = () => {
    if (editorRef.current) onChange(editorToBody(editorRef.current));
    rememberSelection();
  };
  const restoreSelection = () => {
    editorRef.current?.focus();
    const selection = window.getSelection();
    if (selection && savedRangeRef.current) {
      selection.removeAllRanges();
      selection.addRange(savedRangeRef.current);
    }
  };
  const placeCursorAfter = (node: Node) => {
    const selection = window.getSelection();
    const range = document.createRange();
    range.setStartAfter(node);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);
    savedRangeRef.current = range.cloneRange();
  };
  const selectedBlocks = (range: Range) => {
    const editor = editorRef.current;
    if (!editor) return [];
    return Array.from(editor.children).filter(child => range.intersectsNode(child)) as HTMLElement[];
  };
  const applyInline = (tagName: "strong" | "em" | "u" | "s" | "code" | "a", attributes: Record<string,string> = {}) => {
    restoreSelection();
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection?.rangeCount || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    const existing = (selection.anchorNode instanceof HTMLElement ? selection.anchorNode : selection.anchorNode?.parentElement)?.closest(tagName);
    if (existing && editor.contains(existing) && existing.contains(selection.focusNode)) {
      const parent = existing.parentNode;
      while (existing.firstChild) parent?.insertBefore(existing.firstChild, existing);
      existing.remove();
      syncBody();
      return;
    }
    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    let current = walker.nextNode();
    while (current) {
      if (current.textContent && range.intersectsNode(current)) textNodes.push(current as Text);
      current = walker.nextNode();
    }
    const wrappers: HTMLElement[] = [];
    for (const textNode of textNodes.reverse()) {
      const start = textNode === range.startContainer ? range.startOffset : 0;
      const end = textNode === range.endContainer ? range.endOffset : textNode.length;
      if (start >= end) continue;
      const selectedRange = document.createRange();
      selectedRange.setStart(textNode, start);
      selectedRange.setEnd(textNode, end);
      const wrapper = document.createElement(tagName);
      Object.entries(attributes).forEach(([name,value]) => wrapper.setAttribute(name,value));
      selectedRange.surroundContents(wrapper);
      wrappers.unshift(wrapper);
    }
    if (wrappers.length) {
      const updatedRange = document.createRange();
      updatedRange.setStartBefore(wrappers[0]);
      updatedRange.setEndAfter(wrappers[wrappers.length - 1]);
      selection.removeAllRanges();
      selection.addRange(updatedRange);
      savedRangeRef.current = updatedRange.cloneRange();
    }
    syncBody();
  };
  const formatBlocks = (tagName: "h2" | "blockquote") => {
    restoreSelection();
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    const blocks = selectedBlocks(selection.getRangeAt(0));
    let lastBlock: HTMLElement | null = null;
    blocks.forEach(block => {
      const replacement = document.createElement(block.tagName.toLowerCase() === tagName ? "p" : tagName);
      if (tagName === "blockquote" && replacement.tagName.toLowerCase() === "blockquote") replacement.className = "quote";
      replacement.innerHTML = block.innerHTML;
      block.replaceWith(replacement);
      lastBlock = replacement;
    });
    if (lastBlock) placeCursorAfter(lastBlock);
    syncBody();
  };
  const makeList = (tagName: "ul" | "ol") => {
    restoreSelection();
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    const blocks = selectedBlocks(selection.getRangeAt(0));
    if (!blocks.length) return;
    const list = document.createElement(tagName);
    blocks[0].before(list);
    blocks.forEach(block => {
      if (block.tagName.toLowerCase() === "ul" || block.tagName.toLowerCase() === "ol") {
        Array.from(block.children).forEach(item => list.append(item));
      } else {
        const item = document.createElement("li");
        item.innerHTML = block.innerHTML;
        list.append(item);
      }
      block.remove();
    });
    placeCursorAfter(list);
    syncBody();
  };
  const insertHtml = (html: string) => {
    restoreSelection();
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const template = document.createElement("template");
    template.innerHTML = html;
    const lastNode = template.content.lastChild;
    range.insertNode(template.content);
    if (lastNode) placeCursorAfter(lastNode);
    syncBody();
  };
  const addLink = () => {
    const url = window.prompt("Paste the link URL");
    if (url?.startsWith("https://")) applyInline("a", {href:url});
    else if (url) onError("Links must start with https://");
  };
  async function addImage(file?: File) {
    if (!file) return;
    setUploading(true);
    onUploadingChange(true);
    onError("");
    try {
      const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
      const blob = await upload(`articles/${safeName}`, file, {access: "public", handleUploadUrl: "/api/uploads"});
      const caption = escapeHtml(file.name.replace(/\.[^.]+$/, ""));
      insertHtml(`<figure class="body-image-wrap"><img class="body-image" src="${escapeHtml(blob.url)}" alt="${caption}"><figcaption>${caption}</figcaption></figure><p><br></p>`);
    } catch (error) {
      onError(error instanceof Error ? error.message : "The image could not be uploaded.");
    } finally {
      setUploading(false);
      onUploadingChange(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  }
  const runPointerAction = (event: ReactPointerEvent<HTMLButtonElement>, action: () => void) => {
    rememberSelection();
    event.preventDefault();
    action();
  };
  const runKeyboardAction = (event: ReactMouseEvent<HTMLButtonElement>, action: () => void) => {
    if (event.detail === 0) action();
  };
  return <section className="rich-editor-shell">
    <div className="writer-tools" aria-label="Formatting tools">
      <button type="button" disabled={disabled} onPointerDown={event=>runPointerAction(event,()=>applyInline("strong"))} onClick={event=>runKeyboardAction(event,()=>applyInline("strong"))}>B  Bold</button>
      <button type="button" disabled={disabled} onPointerDown={event=>runPointerAction(event,()=>applyInline("em"))} onClick={event=>runKeyboardAction(event,()=>applyInline("em"))}>I  Italic</button>
      <button type="button" disabled={disabled} onPointerDown={event=>runPointerAction(event,()=>applyInline("u"))} onClick={event=>runKeyboardAction(event,()=>applyInline("u"))}>U  Underline</button>
      <button type="button" disabled={disabled} onPointerDown={event=>runPointerAction(event,()=>applyInline("s"))} onClick={event=>runKeyboardAction(event,()=>applyInline("s"))}>S  Strike</button>
      <button type="button" disabled={disabled} onPointerDown={event=>runPointerAction(event,()=>applyInline("code"))} onClick={event=>runKeyboardAction(event,()=>applyInline("code"))}>&lt;/&gt; Code</button>
      <button type="button" disabled={disabled} onPointerDown={event=>runPointerAction(event,()=>formatBlocks("h2"))} onClick={event=>runKeyboardAction(event,()=>formatBlocks("h2"))}>H2  Heading</button>
      <button type="button" disabled={disabled} onPointerDown={event=>runPointerAction(event,()=>formatBlocks("blockquote"))} onClick={event=>runKeyboardAction(event,()=>formatBlocks("blockquote"))}>“  Quote</button>
      <button type="button" disabled={disabled} onPointerDown={event=>runPointerAction(event,()=>makeList("ul"))} onClick={event=>runKeyboardAction(event,()=>makeList("ul"))}>•  List</button>
      <button type="button" disabled={disabled} onPointerDown={event=>runPointerAction(event,()=>makeList("ol"))} onClick={event=>runKeyboardAction(event,()=>makeList("ol"))}>1.  List</button>
      <button type="button" disabled={disabled} onPointerDown={event=>runPointerAction(event,addLink)} onClick={event=>runKeyboardAction(event,addLink)}>↗ Link</button>
      <button type="button" disabled={disabled} onPointerDown={event=>runPointerAction(event,()=>insertHtml('<div class="article-table-wrap"><table class="article-table"><thead><tr><th>Column 1</th><th>Column 2</th></tr></thead><tbody><tr><td>Value</td><td>Value</td></tr></tbody></table></div><p><br></p>'))} onClick={event=>runKeyboardAction(event,()=>insertHtml('<div class="article-table-wrap"><table class="article-table"><thead><tr><th>Column 1</th><th>Column 2</th></tr></thead><tbody><tr><td>Value</td><td>Value</td></tr></tbody></table></div><p><br></p>'))}>▦ Table</button>
      <button type="button" disabled={disabled} onPointerDown={event=>runPointerAction(event,()=>insertHtml("<hr><p><br></p>"))} onClick={event=>runKeyboardAction(event,()=>insertHtml("<hr><p><br></p>"))}>— Divider</button>
      <button type="button" disabled={disabled || uploading} onPointerDown={event=>runPointerAction(event,()=>imageInputRef.current?.click())} onClick={event=>runKeyboardAction(event,()=>imageInputRef.current?.click())}>＋ {uploading ? "Uploading…" : "Image"}</button>
      <input ref={imageInputRef} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" onChange={event=>addImage(event.target.files?.[0])}/>
    </div>
    <div className="rich-editor-label"><span>Story</span><i><span className="dot"/> Visual editor</i></div>
    <div
      ref={editorRef}
      className="story-body rich-editor-canvas"
      contentEditable={!disabled}
      suppressContentEditableWarning
      role="textbox"
      tabIndex={0}
      aria-multiline="true"
      aria-label="Article body"
      data-placeholder="Write your story…"
      onInput={syncBody}
      onKeyUp={rememberSelection}
      onMouseUp={rememberSelection}
    />
  </section>;
}

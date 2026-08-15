import Image from "next/image";
import type { ReactNode } from "react";
import { isRadarEmbed, parseGraphEmbedBlock } from "../../lib/content/graph-embed";
import type { Post, PublicationSettings } from "../../lib/content/types";

function renderInline(text: string): ReactNode[] {
  const tokens = text.split(/(\*\*[^\n]+?\*\*|__[^\n]+?__|\+\+[^\n]+?\+\+|~~[^\n]+?~~|`[^`\n]+`|\[[^\]]+\]\(https:\/\/[^)]+\)|\*[^*\n]+\*|_[^_\n]+_|\n)/g).filter(Boolean);
  return tokens.map((token, index) => {
    if (token === "\n") return <br key={index}/>;
    if ((token.startsWith("**") && token.endsWith("**")) || (token.startsWith("__") && token.endsWith("__"))) return <strong key={index}>{renderInline(token.slice(2, -2))}</strong>;
    if ((token.startsWith("*") && token.endsWith("*")) || (token.startsWith("_") && token.endsWith("_"))) return <em key={index}>{renderInline(token.slice(1, -1))}</em>;
    if (token.startsWith("++") && token.endsWith("++")) return <u key={index}>{renderInline(token.slice(2, -2))}</u>;
    if (token.startsWith("~~") && token.endsWith("~~")) return <s key={index}>{renderInline(token.slice(2, -2))}</s>;
    if (token.startsWith("`") && token.endsWith("`")) return <code key={index}>{token.slice(1, -1)}</code>;
    const link = token.match(/^\[([^\]]+)]\((https:\/\/[^)]+)\)$/);
    if (link) return <a key={index} href={link[2]}>{link[1]}</a>;
    return token;
  });
}

function tableCells(line: string) {
  return line.trim().replace(/^\||\|$/g, "").split("|").map(cell=>cell.trim());
}

function isTable(block: string) {
  const lines = block.split("\n").filter(Boolean);
  return lines.length >= 2 && lines[0].includes("|") && /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(lines[1]);
}

function renderTable(block: string, key: number) {
  const lines = block.split("\n").filter(Boolean);
  const headers = tableCells(lines[0]);
  const rows = lines.slice(2).map(tableCells);
  return <div className="article-table-wrap" key={key}><table className="article-table"><thead><tr>{headers.map((cell,index)=><th key={index}>{renderInline(cell)}</th>)}</tr></thead><tbody>{rows.map((row,rowIndex)=><tr key={rowIndex}>{headers.map((_,cellIndex)=><td key={cellIndex}>{renderInline(row[cellIndex] ?? "")}</td>)}</tr>)}</tbody></table></div>;
}

function renderBody(body: string) {
  return body.split(/\n\n+/).filter(Boolean).map((block, index) => {
    const image = block.match(/^!\[(.*)]\((https:\/\/[^)]+)\)$/);
    const graphEmbed = parseGraphEmbedBlock(block);
    if (block.startsWith("## ")) return <h2 key={index}>{renderInline(block.slice(3))}</h2>;
    if (block.startsWith("> ")) return <blockquote className="quote" key={index}>{renderInline(block.slice(2))}</blockquote>;
    if (block === "---") return <hr key={index}/>;
    if (image) return <figure className="body-image-wrap" key={index}><Image className="body-image" src={image[2]} alt={image[1] || "Article image"} width={1200} height={800} sizes="(max-width: 800px) calc(100vw - 40px), 650px"/>{image[1] ? <figcaption>{image[1]}</figcaption> : null}</figure>;
    if (graphEmbed) return <div className={`graph-embed-wrap ${isRadarEmbed(graphEmbed) ? "is-radar" : ""}`} key={index}><iframe src={graphEmbed} title="TheStatMerchant interactive graph" loading="lazy" allow="fullscreen"/></div>;
    if (isTable(block)) return renderTable(block, index);
    const lines = block.split("\n");
    if (lines.every(line=>/^-\s+/.test(line))) return <ul key={index}>{lines.map((line,lineIndex)=><li key={lineIndex}>{renderInline(line.replace(/^-\s+/, ""))}</li>)}</ul>;
    if (lines.every(line=>/^\d+\.\s+/.test(line))) return <ol key={index}>{lines.map((line,lineIndex)=><li key={lineIndex}>{renderInline(line.replace(/^\d+\.\s+/, ""))}</li>)}</ol>;
    return <p key={index}>{renderInline(block)}</p>;
  });
}

export function ArticleBody({body}:{body:string}) {
  return <>{renderBody(body)}</>;
}

export default function StoryView({post, settings, related, preview = false}:{post:Post; settings:PublicationSettings; related:Post[]; preview?:boolean}) {
  return <>
    {preview ? <div className="preview-banner"><strong>Private preview</strong><span>Only logged-in editors can see this page.</span><a href="/studio">Back to studio</a></div> : null}
    <header className={`article-header ${preview ? "has-preview-banner" : ""}`}>
      <a className="brand-logo-link" href="/studio" aria-label="TheStatMerchant studio"><Image className="brand-logo" src="/Logo/Asset%201.svg" alt="TheStatMerchant" width={110} height={46}/></a>
    </header>
    <main className="article-main">
      <div className="eyebrow article-kicker">Football analysis</div>
      <h1 className="article-title">{post.title}</h1>
      <p className="dek">{post.excerpt}</p>
      <div className="byline"><div className="avatar">{post.author.split(" ").map(part=>part[0]).join("").slice(0,2)}</div><div><strong>By {post.author}</strong><span>{post.date} · {post.readTime} read</span></div></div>
      {post.heroImage ? <figure className="hero-wrap"><div className="hero-image-frame"><Image className="hero-image" src={post.heroImage} alt={`${post.title} cover`} fill priority sizes="100vw"/></div><figcaption className="caption">Illustration: {settings.publication}</figcaption></figure> : null}
      <div className="story-grid">
        <article className="story-body" id="article"><ArticleBody body={post.body}/></article>
        <aside className="related"><h3>Keep reading</h3>{related.map(item=><a key={item.id} href={`/stories/${item.slug}`}>{item.title}</a>)}</aside>
      </div>
    </main>
    <footer className="article-footer"><Image className="footer-logo" src="/Logo/Asset%201.svg" alt="TheStatMerchant" width={94} height={40}/><p>{settings.description}</p></footer>
  </>;
}

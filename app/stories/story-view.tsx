import Image from "next/image";
import type { Post, PublicationSettings } from "../../lib/content/types";

function renderBody(body: string) {
  return body.split(/\n\n+/).filter(Boolean).map((block, index) => {
    const image = block.match(/^!\[(.*)]\((https:\/\/[^)]+)\)$/);
    if (block.startsWith("## ")) return <h2 key={index}>{block.slice(3)}</h2>;
    if (block.startsWith("> ")) return <blockquote className="quote" key={index}>{block.slice(2)}</blockquote>;
    if (block === "---") return <hr key={index}/>;
    if (image) return <figure className="body-image-wrap" key={index}><Image className="body-image" src={image[2]} alt={image[1] || "Article image"} width={1200} height={800} sizes="(max-width: 800px) calc(100vw - 40px), 650px"/>{image[1] ? <figcaption>{image[1]}</figcaption> : null}</figure>;
    return <p key={index}>{block}</p>;
  });
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
        <article className="story-body" id="article">{renderBody(post.body)}</article>
        <aside className="related"><h3>Keep reading</h3>{related.map(item=><a key={item.id} href={`/stories/${item.slug}`}>{item.title}</a>)}</aside>
      </div>
    </main>
    <footer className="article-footer"><Image className="footer-logo" src="/Logo/Asset%201.svg" alt="TheStatMerchant" width={94} height={40}/><p>{settings.description}</p></footer>
  </>;
}

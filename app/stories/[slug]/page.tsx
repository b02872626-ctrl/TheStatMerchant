import { notFound } from "next/navigation";
import { getPublishedPost, getPosts, getSettings } from "../../../lib/content/store";

export const dynamic = "force-dynamic";

function renderBody(body:string){return body.split(/\n\n+/).filter(Boolean).map((block,index)=>block.startsWith("## ")?<h2 key={index}>{block.slice(3)}</h2>:block.startsWith("> ")?<blockquote className="quote" key={index}>{block.slice(2)}</blockquote>:block==="---"?<hr key={index}/>:<p key={index}>{block}</p>)}

export default async function StoryPage({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params; const [post,settings,allPosts]=await Promise.all([getPublishedPost(slug),getSettings(),getPosts()]); if(!post)notFound();
  const related=allPosts.filter(item=>item.status==="Published"&&item.slug!==slug).slice(0,3);
  return <>
    <header className="article-header">
      <a className="brand-logo-link" href="/studio" aria-label="TheStatMerchant studio"><img className="brand-logo" src="/Logo/Asset%201.svg" alt="TheStatMerchant" /></a>
    </header>
    <main className="article-main">
      <div className="eyebrow article-kicker">Football analysis</div>
      <h1 className="article-title">{post.title}</h1>
      <p className="dek">{post.excerpt}</p>
      <div className="byline"><div className="avatar">{post.author.split(" ").map(part=>part[0]).join("").slice(0,2)}</div><div><strong>By {post.author}</strong><span>{post.date} · {post.readTime} read</span></div></div>
      {post.heroImage&&<figure className="hero-wrap"><img className="hero-image" src={post.heroImage} alt="Editorial football illustration"/><figcaption className="caption">Illustration: {settings.publication}</figcaption></figure>}
      <div className="story-grid">
        <article className="story-body" id="article">
          {renderBody(post.body)}
        </article>
        <aside className="related"><h3>Keep reading</h3>{related.map(item=><a key={item.id} href={`/stories/${item.slug}`}>{item.title}</a>)}</aside>
      </div>
    </main>
    <footer className="article-footer"><img className="footer-logo" src="/Logo/Asset%201.svg" alt="TheStatMerchant"/><p>{settings.description}</p></footer>
  </>;
}

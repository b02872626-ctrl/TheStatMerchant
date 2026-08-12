"use client";

import { useMemo, useState } from "react";

type Post = { id: number; title: string; slug: string; status: "Published" | "Draft"; date: string; reads: string; excerpt: string };

const initialPosts: Post[] = [
  { id: 1, title: "Why the Premier League’s best wingers are moving inside", slug: "inside-forwards-premier-league", status: "Published", date: "12 Aug 2026", reads: "4.8k", excerpt: "The touchline winger is disappearing. Here is what is replacing him — and why it is so difficult to defend." },
  { id: 2, title: "The £40m midfielder hiding in plain sight", slug: "midfielder-hiding-in-plain-sight", status: "Draft", date: "Edited 2h ago", reads: "—", excerpt: "A data-led look at the league's most undervalued controller." },
  { id: 3, title: "Five set-piece trends to watch this season", slug: "five-set-piece-trends", status: "Published", date: "8 Aug 2026", reads: "7.1k", excerpt: "From blocker screens to crowding the goalkeeper, the details shaping dead balls." },
];

export default function Studio() {
  const [posts, setPosts] = useState(initialPosts);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Post | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const shown = useMemo(() => posts.filter(p => p.title.toLowerCase().includes(query.toLowerCase())), [posts, query]);

  function save(post = editing) {
    if (!post) return;
    setPosts(current => current.some(p => p.id === post.id) ? current.map(p => p.id === post.id ? post : p) : [post, ...current]);
    setEditing(null);
  }

  async function copyLink(post: Post) {
    const link = `${window.location.origin}/stories/${post.slug}`;
    await navigator.clipboard?.writeText(link);
    setCopied(post.id);
    setTimeout(() => setCopied(null), 1600);
  }

  const newPost = () => setEditing({ id: Date.now(), title: "Untitled story", slug: "untitled-story", status: "Draft", date: "Just now", reads: "—", excerpt: "" });

  return <main className="studio">
    <aside className="studio-side">
      <a className="studio-logo-link" href="/studio" aria-label="TheStatMerchant studio"><img className="studio-logo" src="/Logo/Asset%201.svg" alt="TheStatMerchant" /></a>
      <nav aria-label="Studio navigation">
        <button className="nav-item active">Stories</button>
        <button className="nav-item">Analytics</button>
        <button className="nav-item">Settings</button>
      </nav>
      <div className="side-bottom"><strong style={{color:"white"}}>Nahu, editor</strong><br/>Premier League desk</div>
    </aside>
    <section className="studio-main">
      <header className="studio-head">
        <div><div className="eyebrow">Editorial studio</div><h1>Your stories</h1></div>
        <button className="primary-btn" onClick={newPost}>+ New story</button>
      </header>
      <section className="stats" aria-label="Publishing summary">
        <div className="stat"><strong>{posts.filter(p=>p.status === "Published").length}</strong><span>Published stories</span></div>
        <div className="stat"><strong>11.9k</strong><span>Total reads this month</span></div>
        <div className="stat"><strong>68%</strong><span>From Telegram</span></div>
      </section>
      <section className="content-card">
        <div className="card-head"><h2>All stories</h2><input className="search" aria-label="Search stories" placeholder="Search stories…" value={query} onChange={e=>setQuery(e.target.value)} /></div>
        {shown.map(post => <div className="post-row" key={post.id}>
          <div><div className="post-title">{post.title}</div><div className="post-slug">/stories/{post.slug}</div></div>
          <span className={`status ${post.status === "Draft" ? "draft" : ""}`}>{post.status}</span>
          <span className="post-meta">{post.date}</span>
          <span className="post-meta">{post.reads} reads</span>
          <button className="icon-btn" aria-label={`Edit ${post.title}`} onClick={()=>setEditing(post)}>•••</button>
          <div style={{gridColumn:"1 / -1", display:"flex", gap:8, marginTop:-7}}>
            {post.status === "Published" && <a className="pill" href={`/stories/${post.slug}`} target="_blank">View story ↗</a>}
            <button className="pill" onClick={()=>copyLink(post)}>{copied === post.id ? "Copied!" : "Copy link"}</button>
          </div>
        </div>)}
      </section>
    </section>
    {editing && <div className="editor-mask" role="dialog" aria-modal="true" aria-label="Story editor">
      <section className="editor">
        <div className="editor-top"><h2>Edit story</h2><button className="icon-btn" onClick={()=>setEditing(null)} aria-label="Close editor">×</button></div>
        <label className="field"><span>Headline</span><input value={editing.title} onChange={e=>setEditing({...editing,title:e.target.value})}/></label>
        <label className="field"><span>Link</span><input value={editing.slug} onChange={e=>setEditing({...editing,slug:e.target.value.toLowerCase().replace(/[^a-z0-9]+/g,"-")})}/></label>
        <label className="field"><span>Standfirst</span><textarea value={editing.excerpt} onChange={e=>setEditing({...editing,excerpt:e.target.value})}/></label>
        <div className="editor-actions"><button className="secondary-btn" onClick={()=>save({...editing,status:"Draft"})}>Save as draft</button><button className="primary-btn" onClick={()=>save({...editing,status:"Published"})}>Publish story</button><button className="primary-btn" onClick={()=>save()}>Save changes</button></div>
      </section>
    </div>}
  </main>;
}

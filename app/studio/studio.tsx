"use client";

import { useMemo, useState } from "react";

type View = "stories" | "analytics" | "settings";
type Post = { id: number; title: string; slug: string; status: "Published" | "Draft"; date: string; reads: string; views: number; readTime: string; excerpt: string; body: string };

const initialPosts: Post[] = [
  { id: 1, title: "Why the Premier League’s best wingers are moving inside", slug: "inside-forwards-premier-league", status: "Published", date: "12 Aug 2026", reads: "4.8k", views: 4826, readTime: "6m 18s", excerpt: "The touchline winger is disappearing. Here is what is replacing him — and why it is so difficult to defend.", body: "For most of football history, the winger’s instructions could be drawn as a straight line. Stay wide. Beat the full-back. Reach the byline. Deliver.\n\nThe modern Premier League has bent that line until it points directly at goal." },
  { id: 2, title: "The £40m midfielder hiding in plain sight", slug: "midfielder-hiding-in-plain-sight", status: "Draft", date: "Edited 2h ago", reads: "—", views: 0, readTime: "—", excerpt: "A data-led look at the league's most undervalued controller.", body: "" },
  { id: 3, title: "Five set-piece trends to watch this season", slug: "five-set-piece-trends", status: "Published", date: "8 Aug 2026", reads: "7.1k", views: 7119, readTime: "5m 42s", excerpt: "From blocker screens to crowding the goalkeeper, the details shaping dead balls.", body: "Set pieces are no longer a pause between phases. They are designed attacks with their own specialists, decoys and repeatable patterns." },
];

export default function Studio() {
  const [view, setView] = useState<View>("stories");
  const [posts, setPosts] = useState(initialPosts);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Post | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [author, setAuthor] = useState("Nahu M.");
  const [publication, setPublication] = useState("TheStatMerchant");
  const [description, setDescription] = useState("Sharp Premier League analysis, built for the group chat.");
  const [saved, setSaved] = useState(false);
  const shown = useMemo(() => posts.filter(p => p.title.toLowerCase().includes(query.toLowerCase())), [posts, query]);
  const published = posts.filter(p => p.status === "Published");

  function save(post = editing) {
    if (!post) return;
    setPosts(current => current.some(p => p.id === post.id) ? current.map(p => p.id === post.id ? post : p) : [post, ...current]);
    setEditing(null);
  }
  async function copyLink(post: Post) {
    await navigator.clipboard?.writeText(`${window.location.origin}/stories/${post.slug}`);
    setCopied(post.id); setTimeout(() => setCopied(null), 1600);
  }
  const newPost = () => setEditing({ id: Date.now(), title: "", slug: "", status: "Draft", date: "Just now", reads: "—", views: 0, readTime: "—", excerpt: "", body: "" });
  const setTitle = (title: string) => editing && setEditing({...editing, title, slug: title.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")});
  const addBlock = (kind: "heading" | "quote" | "divider") => {
    if (!editing) return;
    const block = kind === "heading" ? "\n\n## Section heading\n\n" : kind === "quote" ? "\n\n> Add a memorable quote\n\n" : "\n\n---\n\n";
    setEditing({...editing, body: editing.body + block});
  };
  const headings = { stories: ["Editorial studio", "Your stories"], analytics: ["Performance", "Story analytics"], settings: ["Publication", "Settings"] };

  return <main className="studio">
    <aside className="studio-side">
      <a className="studio-logo-link" href="/studio" aria-label="TheStatMerchant studio"><img className="studio-logo" src="/Logo/Asset%201.svg" alt="TheStatMerchant" /></a>
      <nav aria-label="Studio navigation">
        {(["stories","analytics","settings"] as View[]).map(item => <button key={item} className={`nav-item ${view === item ? "active" : ""}`} onClick={()=>setView(item)}>{item[0].toUpperCase()+item.slice(1)}</button>)}
      </nav>
      <div className="side-bottom"><strong style={{color:"white"}}>{author}, editor</strong><br/>Premier League desk</div>
    </aside>
    <section className="studio-main">
      <header className="studio-head">
        <div><div className="eyebrow">{headings[view][0]}</div><h1>{headings[view][1]}</h1></div>
        {view === "stories" && <button className="primary-btn" onClick={newPost}>+ New story</button>}
      </header>

      {view === "stories" && <>
        <section className="stats"><div className="stat"><strong>{published.length}</strong><span>Published stories</span></div><div className="stat"><strong>11.9k</strong><span>Total reads this month</span></div><div className="stat"><strong>68%</strong><span>From Telegram</span></div></section>
        <section className="content-card"><div className="card-head"><h2>All stories</h2><input className="search" aria-label="Search stories" placeholder="Search stories…" value={query} onChange={e=>setQuery(e.target.value)} /></div>
          {shown.map(post => <div className="post-row" key={post.id}><div><div className="post-title">{post.title}</div><div className="post-slug">/stories/{post.slug}</div></div><span className={`status ${post.status === "Draft" ? "draft" : ""}`}>{post.status}</span><span className="post-meta">{post.date}</span><span className="post-meta">{post.reads} reads</span><button className="icon-btn" aria-label={`Edit ${post.title}`} onClick={()=>setEditing(post)}>•••</button><div style={{gridColumn:"1 / -1",display:"flex",gap:8,marginTop:-7}}>{post.status === "Published" && <a className="pill" href={`/stories/${post.slug}`} target="_blank">View story ↗</a>}<button className="pill" onClick={()=>copyLink(post)}>{copied === post.id ? "Copied!" : "Copy link"}</button></div></div>)}
        </section>
      </>}

      {view === "analytics" && <>
        <section className="stats"><div className="stat"><strong>11,945</strong><span>Story views</span><small>↑ 18% this month</small></div><div className="stat"><strong>6m 02s</strong><span>Average reading time</span><small>72% average completion</small></div><div className="stat"><strong>7,119</strong><span>Top story views</span><small>Five set-piece trends</small></div></section>
        <section className="analytics-grid"><div className="content-card chart-card"><div className="card-head"><h2>Views · last 7 days</h2><span className="post-meta">6–12 Aug</span></div><div className="bars" aria-label="Daily story views chart">{[42,58,37,71,64,85,100].map((h,i)=><div className="bar-wrap" key={i}><div className="bar" style={{height:`${h}%`}}/><span>{["Thu","Fri","Sat","Sun","Mon","Tue","Wed"][i]}</span></div>)}</div></div>
        <div className="content-card"><div className="card-head"><h2>Top-performing posts</h2></div>{[...published].sort((a,b)=>b.views-a.views).map((post,i)=><div className="rank-row" key={post.id}><strong>0{i+1}</strong><div><div className="post-title">{post.title}</div><span className="post-meta">{post.readTime} avg. read</span></div><b>{post.views.toLocaleString()}</b></div>)}</div></section>
      </>}

      {view === "settings" && <section className="settings-wrap"><div className="content-card settings-card"><div className="card-head"><div><h2>Publication details</h2><p>Shown across your editorial studio and article metadata.</p></div></div><div className="settings-form"><label className="field"><span>Author name</span><input value={author} onChange={e=>setAuthor(e.target.value)}/></label><label className="field"><span>Publication name</span><input value={publication} onChange={e=>setPublication(e.target.value)}/></label><label className="field"><span>Publication description</span><textarea value={description} onChange={e=>setDescription(e.target.value)}/></label><label className="field"><span>Primary coverage</span><input value="Premier League and world football" readOnly/></label><div className="settings-actions"><span>{saved ? "Changes saved" : ""}</span><button className="primary-btn" onClick={()=>{setSaved(true);setTimeout(()=>setSaved(false),1800)}}>Save settings</button></div></div></div></section>}
    </section>
    {editing && <div className="writer" role="dialog" aria-modal="true" aria-label="Story editor">
      <header className="writer-bar"><button className="writer-back" onClick={()=>setEditing(null)}>← Stories</button><div className="writer-state"><span className="dot"/> Draft saved</div><div className="writer-actions"><button className="secondary-btn" onClick={()=>save({...editing,status:"Draft"})}>Save draft</button><button className="primary-btn" disabled={!editing.title.trim() || !editing.body.trim()} onClick={()=>save({...editing,status:"Published"})}>Publish</button></div></header>
      <main className="writer-page">
        <input className="writer-title" aria-label="Story title" placeholder="Title" value={editing.title} onChange={e=>setTitle(e.target.value)}/>
        <textarea className="writer-dek" aria-label="Story summary" placeholder="Your story in one or two sentences…" value={editing.excerpt} onChange={e=>setEditing({...editing,excerpt:e.target.value})}/>
        <div className="writer-meta"><span>By</span><input aria-label="Author name" value={author} onChange={e=>setAuthor(e.target.value)}/><span className="writer-url">/stories/{editing.slug || "your-story"}</span></div>
        <div className="writer-tools" aria-label="Formatting tools"><button onClick={()=>addBlock("heading")}><b>H</b> Heading</button><button onClick={()=>addBlock("quote")}><b>“</b> Quote</button><button onClick={()=>addBlock("divider")}><b>—</b> Divider</button><button title="Add image"><b>＋</b> Image</button></div>
        <textarea autoFocus className="writer-body" aria-label="Article body" placeholder="Write your story…" value={editing.body} onChange={e=>setEditing({...editing,body:e.target.value})}/>
        <div className="writer-foot"><span>{editing.body.trim() ? editing.body.trim().split(/\s+/).length : 0} words</span><span>Use ## for headings and &gt; for quotes</span></div>
      </main>
    </div>}
  </main>;
}

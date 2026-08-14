"use client";

import { upload } from "@vercel/blob/client";
import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { ArticleBody } from "../stories/story-view";
import GraphBuilder from "./graphs/graph-builder";
import type { Post, PublicationSettings } from "../../lib/content/types";

type View = "stories" | "graphs" | "analytics" | "settings";
export default function Studio({initialPosts,initialSettings}:{initialPosts:Post[];initialSettings:PublicationSettings}) {
  const [view, setView] = useState<View>("stories");
  const [posts, setPosts] = useState(initialPosts);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Post | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [author, setAuthor] = useState(initialSettings.author);
  const [publication, setPublication] = useState(initialSettings.publication);
  const [description, setDescription] = useState(initialSettings.description);
  const [coverage, setCoverage] = useState(initialSettings.coverage);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [editorState, setEditorState] = useState<"ready" | "saving" | "saved">("ready");
  const [uploadingImage, setUploadingImage] = useState<"body" | "cover" | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const shown = useMemo(() => posts.filter(p => p.title.toLowerCase().includes(query.toLowerCase())), [posts, query]);
  const published = posts.filter(p => p.status === "Published");

  async function save(post = editing, closeAfterSave = false): Promise<Post | null> {
    if (!post) return null;
    setSaveError("");
    setEditorState("saving");
    try {
      const response=await fetch("/api/posts",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({...post,author})});
      if(!response.ok){const result=await response.json().catch(()=>({}));setSaveError(result.error ?? "The story could not be saved.");setEditorState("ready");return null;}
      const savedPost=await response.json() as Post;
      setPosts(current => current.some(p => p.id === savedPost.id||p.slug===savedPost.slug) ? current.map(p => p.id === savedPost.id||p.slug===savedPost.slug ? savedPost : p) : [savedPost, ...current]);
      setEditorState("saved");
      setEditing(closeAfterSave ? null : savedPost);
      return savedPost;
    } catch {
      setSaveError("The story could not be saved. Check your connection and try again.");
      setEditorState("ready");
      return null;
    }
  }
  async function preview() {
    if (!editing) return;
    const previewWindow = window.open("", "_blank");
    const savedPost = await save(editing);
    if (!savedPost) { previewWindow?.close(); return; }
    const previewUrl = `/studio/preview/${savedPost.slug}`;
    if (previewWindow) previewWindow.location.href = previewUrl;
    else window.location.href = previewUrl;
  }
  async function copyLink(post: Post) {
    await navigator.clipboard?.writeText(`${window.location.origin}/stories/${post.slug}`);
    setCopied(post.id); setTimeout(() => setCopied(null), 1600);
  }
  const startEditing = (post: Post) => { setSaveError(""); setEditorState("ready"); setEditing(post); };
  const newPost = () => startEditing({ id: Date.now(), title: "", slug: "", status: "Draft", date: "Just now", reads: "—", views: 0, readTime: "—", excerpt: "", body: "",author,heroImage:"" });
  const setTitle = (title: string) => { if (!editing) return; setEditorState("ready"); setEditing({...editing, title, slug: title.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}); };
  const insertAtCursor = (before: string, after = "", placeholder = "") => {
    if (!editing) return;
    const textarea = bodyRef.current;
    const start = textarea?.selectionStart ?? editing.body.length;
    const end = textarea?.selectionEnd ?? start;
    const selected = editing.body.slice(start, end) || placeholder;
    const insertion = `${before}${selected}${after}`;
    setEditorState("ready");
    setEditing({...editing, body: editing.body.slice(0, start) + insertion + editing.body.slice(end)});
    requestAnimationFrame(() => {
      const selectionStart = start + before.length;
      bodyRef.current?.focus();
      bodyRef.current?.setSelectionRange(selectionStart, selectionStart + selected.length);
    });
  };
  const addBlock = (kind: "heading" | "quote" | "divider" | "table") => {
    const blocks = {
      heading: ["\n\n## ", "\n\n", "Section heading"],
      quote: ["\n\n> ", "\n\n", "Add a memorable quote"],
      divider: ["\n\n---\n\n", "", ""],
      table: ["\n\n| Player | Minutes | Goals |\n| --- | ---: | ---: |\n| Player name | 0 | 0 |\n| Player name | 0 | 0 |\n\n", "", ""],
    } as const;
    const [before, after, placeholder] = blocks[kind];
    insertAtCursor(before, after, placeholder);
  };
  async function addImage(file?: File) {
    if (!file || !editing) return;
    setSaveError("");
    setUploadingImage("body");
    try {
      const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
      const blob = await upload(`articles/${safeName}`, file, {
        access: "public",
        handleUploadUrl: "/api/uploads",
      });
      const textarea = bodyRef.current;
      const start = textarea?.selectionStart ?? editing.body.length;
      const end = textarea?.selectionEnd ?? start;
      const imageBlock = `\n\n![${file.name.replace(/\.[^.]+$/, "")}](${blob.url})\n\n`;
      setEditing(current => current ? {...current, body: current.body.slice(0, start) + imageBlock + current.body.slice(end)} : current);
      setEditorState("ready");
      requestAnimationFrame(() => {
        const cursor = start + imageBlock.length;
        bodyRef.current?.focus();
        bodyRef.current?.setSelectionRange(cursor, cursor);
      });
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "The image could not be uploaded.");
    } finally {
      setUploadingImage(null);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  }
  async function addCoverImage(file?: File) {
    if (!file || !editing) return;
    setSaveError("");
    setUploadingImage("cover");
    try {
      const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
      const blob = await upload(`articles/covers/${safeName}`, file, {
        access: "public",
        handleUploadUrl: "/api/uploads",
      });
      setEditing(current => current ? {...current, heroImage: blob.url} : current);
      setEditorState("ready");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "The cover image could not be uploaded.");
    } finally {
      setUploadingImage(null);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  }
  const headings = { stories: ["Editorial studio", "Your stories"], graphs: ["TheStatMerchant Graphs", "Player comparison"], analytics: ["Performance", "Story analytics"], settings: ["Publication", "Settings"] };

  return <main className="studio">
    <aside className="studio-side">
      <a className="studio-logo-link" href="/studio" aria-label="TheStatMerchant studio"><Image className="studio-logo" src="/Logo/Asset%201.svg" alt="TheStatMerchant" width={118} height={70}/></a>
      <nav aria-label="Studio navigation">
        {(["stories","graphs","analytics","settings"] as View[]).map(item => <button key={item} className={`nav-item ${view === item ? "active" : ""}`} onClick={()=>setView(item)}>{item[0].toUpperCase()+item.slice(1)}</button>)}
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
          {shown.map(post => <div className="post-row" key={post.id}><div><div className="post-title">{post.title}</div><div className="post-slug">/stories/{post.slug}</div></div><span className={`status ${post.status === "Draft" ? "draft" : ""}`}>{post.status}</span><span className="post-meta">{post.date}</span><span className="post-meta">{post.reads} reads</span><button className="icon-btn" aria-label={`Edit ${post.title}`} onClick={()=>startEditing(post)}>•••</button><div style={{gridColumn:"1 / -1",display:"flex",gap:8,marginTop:-7}}><a className="pill" href={post.status === "Published" ? `/stories/${post.slug}` : `/studio/preview/${post.slug}`} target="_blank" rel="noreferrer">{post.status === "Published" ? "View story ↗" : "Preview ↗"}</a><button className="pill" onClick={()=>copyLink(post)}>{copied === post.id ? "Copied!" : "Copy link"}</button></div></div>)}
        </section>
      </>}

      {view === "analytics" && <>
        <section className="stats"><div className="stat"><strong>11,945</strong><span>Story views</span><small>↑ 18% this month</small></div><div className="stat"><strong>6m 02s</strong><span>Average reading time</span><small>72% average completion</small></div><div className="stat"><strong>7,119</strong><span>Top story views</span><small>Five set-piece trends</small></div></section>
        <section className="analytics-grid"><div className="content-card chart-card"><div className="card-head"><h2>Views · last 7 days</h2><span className="post-meta">6–12 Aug</span></div><div className="bars" aria-label="Daily story views chart">{[42,58,37,71,64,85,100].map((h,i)=><div className="bar-wrap" key={i}><div className="bar" style={{height:`${h}%`}}/><span>{["Thu","Fri","Sat","Sun","Mon","Tue","Wed"][i]}</span></div>)}</div></div>
        <div className="content-card"><div className="card-head"><h2>Top-performing posts</h2></div>{[...published].sort((a,b)=>b.views-a.views).map((post,i)=><div className="rank-row" key={post.id}><strong>0{i+1}</strong><div><div className="post-title">{post.title}</div><span className="post-meta">{post.readTime} avg. read</span></div><b>{post.views.toLocaleString()}</b></div>)}</div></section>
      </>}

      {view === "graphs" && <GraphBuilder/>}

      {view === "settings" && <section className="settings-wrap"><div className="content-card settings-card"><div className="card-head"><div><h2>Publication details</h2><p>Shown across your editorial studio and article metadata.</p></div></div><div className="settings-form"><label className="field"><span>Author name</span><input value={author} onChange={e=>setAuthor(e.target.value)}/></label><label className="field"><span>Publication name</span><input value={publication} onChange={e=>setPublication(e.target.value)}/></label><label className="field"><span>Publication description</span><textarea value={description} onChange={e=>setDescription(e.target.value)}/></label><label className="field"><span>Primary coverage</span><input value={coverage} onChange={e=>setCoverage(e.target.value)}/></label><div className="settings-actions"><span>{saved ? "Changes saved" : ""}</span><button className="primary-btn" onClick={async()=>{const response=await fetch("/api/settings",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({author,publication,description,coverage})});if(response.ok){setSaved(true);setTimeout(()=>setSaved(false),1800)}}}>Save settings</button></div></div></div></section>}
    </section>
    {editing && <div className="writer" role="dialog" aria-modal="true" aria-label="Story editor">
      <header className="writer-bar"><button className="writer-back" onClick={()=>setEditing(null)}>← Stories</button><div className={`writer-state ${saveError ? "writer-error" : ""}`}>{saveError || <><span className="dot"/> {editorState === "saving" ? "Saving…" : editorState === "saved" ? "Saved" : "Ready to save"}</>}</div><div className="writer-actions"><button className="secondary-btn" disabled={!editing.title.trim() || editorState === "saving" || Boolean(uploadingImage)} onClick={()=>save(editing)}>Save</button><button className="secondary-btn" disabled={!editing.title.trim() || editorState === "saving" || Boolean(uploadingImage)} onClick={preview}>Preview ↗</button><button className="primary-btn" disabled={!editing.title.trim() || !editing.body.trim() || editorState === "saving" || Boolean(uploadingImage)} onClick={()=>save({...editing,status:"Published"},true)}>Publish</button></div></header>
      <main className="writer-page">
        <input className="writer-title" aria-label="Story title" placeholder="Title" value={editing.title} onChange={e=>setTitle(e.target.value)}/>
        <textarea className="writer-dek" aria-label="Story summary" placeholder="Your story in one or two sentences…" value={editing.excerpt} onChange={e=>{setEditorState("ready");setEditing({...editing,excerpt:e.target.value})}}/>
        <div className="writer-meta"><span>By</span><input aria-label="Author name" value={author} onChange={e=>{setEditorState("ready");setAuthor(e.target.value)}}/><span className="writer-url">/stories/{editing.slug || "your-story"}</span></div>
        <section className={`writer-cover ${editing.heroImage ? "has-cover" : ""}`}>
          <div className="writer-cover-head"><div><strong>Cover image</strong><span>Shown full-width below the headline.</span></div><div><button className="secondary-btn" disabled={Boolean(uploadingImage)} onClick={()=>coverInputRef.current?.click()}>{uploadingImage === "cover" ? "Uploading…" : editing.heroImage ? "Replace" : "Add cover"}</button>{editing.heroImage ? <button className="text-btn" onClick={()=>{setEditorState("ready");setEditing({...editing,heroImage:""})}}>Remove</button> : null}</div></div>
          {editing.heroImage ? <div className="writer-cover-preview"><Image src={editing.heroImage} alt="Cover preview" fill sizes="760px"/></div> : <button className="writer-cover-empty" disabled={Boolean(uploadingImage)} onClick={()=>coverInputRef.current?.click()}><b>＋</b><span>Add a landscape cover image</span><small>JPEG, PNG, WebP, GIF or AVIF · up to 10 MB</small></button>}
          <input ref={coverInputRef} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" onChange={event=>addCoverImage(event.target.files?.[0])}/>
        </section>
        <div className="writer-tools" aria-label="Formatting tools"><button title="Bold selected text" onClick={()=>insertAtCursor("**","**","bold text")}><b>B</b> Bold</button><button title="Italicize selected text" onClick={()=>insertAtCursor("*","*","italic text")}><b><i>I</i></b> Italic</button><button onClick={()=>addBlock("heading")}><b>H</b> Heading</button><button onClick={()=>addBlock("quote")}><b>“</b> Quote</button><button onClick={()=>addBlock("table")}><b>▦</b> Table</button><button onClick={()=>addBlock("divider")}><b>—</b> Divider</button><button title="Add image" disabled={Boolean(uploadingImage)} onClick={()=>imageInputRef.current?.click()}><b>＋</b> {uploadingImage === "body" ? "Uploading…" : "Image"}</button><input ref={imageInputRef} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" onChange={event=>addImage(event.target.files?.[0])}/></div>
        <div className="writer-workbench">
          <section className="writer-compose"><div className="writer-pane-label">Write</div><textarea ref={bodyRef} className="writer-body" aria-label="Article body" placeholder="Write your story…" value={editing.body} onChange={e=>{setEditorState("ready");setEditing({...editing,body:e.target.value})}}/></section>
          <section className="writer-live-preview" aria-label="Live article preview"><div className="writer-pane-label"><span>Live preview</span><i><span className="dot"/> Updates as you type</i></div><article className="story-body writer-live-body">{editing.body.trim() ? <ArticleBody body={editing.body}/> : <p className="writer-preview-empty">Your formatted story, tables and images will appear here.</p>}</article></section>
        </div>
        <div className="writer-foot"><span>{editing.body.trim() ? editing.body.trim().split(/\s+/).length : 0} words</span><span>Use ## for headings and &gt; for quotes</span></div>
      </main>
    </div>}
  </main>;
}

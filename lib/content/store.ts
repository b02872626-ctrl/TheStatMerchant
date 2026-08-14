import { neon } from "@neondatabase/serverless";
import { seedPosts, seedSettings } from "./seed";
import type { Post, PublicationSettings } from "./types";

const connectionString = process.env.DATABASE_URL;
let initialized = false;

export function hasPersistentStorage() {
  return Boolean(connectionString);
}

function db() {
  if (!connectionString) return null;
  return neon(connectionString);
}

async function ensureSchema() {
  const sql = db();
  if (!sql || initialized) return;
  await sql.transaction([
    sql`SELECT pg_advisory_xact_lock(hashtext('thestatmerchant_schema_v1'))`,
    sql`CREATE TABLE IF NOT EXISTS posts (
      id BIGSERIAL PRIMARY KEY, title TEXT NOT NULL, slug TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'Draft', published_label TEXT NOT NULL DEFAULT 'Just now',
      views INTEGER NOT NULL DEFAULT 0, read_time TEXT NOT NULL DEFAULT '—', excerpt TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT '', author TEXT NOT NULL DEFAULT 'Nahu M.', hero_image TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      trashed_at TIMESTAMPTZ
    )`,
    sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS trashed_at TIMESTAMPTZ`,
    sql`CREATE TABLE IF NOT EXISTS publication_settings (
      id INTEGER PRIMARY KEY DEFAULT 1, author TEXT NOT NULL, publication TEXT NOT NULL,
      description TEXT NOT NULL, coverage TEXT NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  ]);
  const count = await sql`SELECT COUNT(*)::int AS count FROM posts`;
  if (Number(count[0]?.count ?? 0) === 0) {
    for (const post of seedPosts) {
      await sql`INSERT INTO posts (title,slug,status,published_label,views,read_time,excerpt,body,author,hero_image)
        VALUES (${post.title},${post.slug},${post.status},${post.date},${post.views},${post.readTime},${post.excerpt},${post.body},${post.author},${post.heroImage})
        ON CONFLICT (slug) DO NOTHING`;
    }
  }
  await sql`INSERT INTO publication_settings (id,author,publication,description,coverage)
    VALUES (1,${seedSettings.author},${seedSettings.publication},${seedSettings.description},${seedSettings.coverage})
    ON CONFLICT (id) DO NOTHING`;
  initialized = true;
}

function toPost(row: Record<string, unknown>): Post {
  const views = Number(row.views ?? 0);
  return { id:Number(row.id), title:String(row.title), slug:String(row.slug), status:row.status === "Published" ? "Published" : "Draft", date:String(row.published_label), reads:views ? views >= 1000 ? `${(views/1000).toFixed(1)}k` : String(views) : "—", views, readTime:String(row.read_time), excerpt:String(row.excerpt), body:String(row.body), author:String(row.author), heroImage:String(row.hero_image) };
}

export async function getPosts(): Promise<Post[]> {
  const sql = db(); if (!sql) return seedPosts;
  await ensureSchema(); return (await sql`SELECT * FROM posts WHERE trashed_at IS NULL ORDER BY updated_at DESC`).map(row=>toPost(row as Record<string,unknown>));
}

export async function getPublishedPost(slug: string): Promise<Post | null> {
  const sql = db(); if (!sql) return seedPosts.find(p=>p.slug===slug&&p.status==="Published") ?? null;
  await ensureSchema(); const rows=await sql`SELECT * FROM posts WHERE slug=${slug} AND status='Published' AND trashed_at IS NULL LIMIT 1`; return rows[0] ? toPost(rows[0] as Record<string,unknown>) : null;
}

export async function getPost(slug: string): Promise<Post | null> {
  const sql = db(); if (!sql) return seedPosts.find(p=>p.slug===slug) ?? null;
  await ensureSchema(); const rows=await sql`SELECT * FROM posts WHERE slug=${slug} AND trashed_at IS NULL LIMIT 1`; return rows[0] ? toPost(rows[0] as Record<string,unknown>) : null;
}

export async function savePost(post: Post): Promise<Post> {
  const sql = db(); if (!sql) return post;
  await ensureSchema();
  const rows=await sql`INSERT INTO posts (title,slug,status,published_label,views,read_time,excerpt,body,author,hero_image)
    VALUES (${post.title},${post.slug},${post.status},${post.status === "Published" ? new Date().toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}) : "Edited just now"},${post.views},${post.readTime},${post.excerpt},${post.body},${post.author},${post.heroImage})
    ON CONFLICT (slug) DO UPDATE SET title=EXCLUDED.title,status=EXCLUDED.status,published_label=EXCLUDED.published_label,excerpt=EXCLUDED.excerpt,body=EXCLUDED.body,author=EXCLUDED.author,hero_image=EXCLUDED.hero_image,updated_at=NOW(),trashed_at=NULL
    RETURNING *`;
  return toPost(rows[0] as Record<string,unknown>);
}

export async function trashPost(id: number): Promise<boolean> {
  const sql = db();
  if (!sql) return false;
  await ensureSchema();
  const rows = await sql`UPDATE posts SET trashed_at=NOW(),updated_at=NOW() WHERE id=${id} AND trashed_at IS NULL RETURNING id`;
  return rows.length > 0;
}

export async function getSettings(): Promise<PublicationSettings> {
  const sql=db(); if(!sql) return seedSettings;
  await ensureSchema(); const rows=await sql`SELECT * FROM publication_settings WHERE id=1`; const row=rows[0];
  return row ? {author:String(row.author),publication:String(row.publication),description:String(row.description),coverage:String(row.coverage)} : seedSettings;
}

export async function saveSettings(settings: PublicationSettings) {
  const sql=db(); if(!sql) return settings;
  await ensureSchema(); await sql`INSERT INTO publication_settings (id,author,publication,description,coverage) VALUES (1,${settings.author},${settings.publication},${settings.description},${settings.coverage}) ON CONFLICT (id) DO UPDATE SET author=EXCLUDED.author,publication=EXCLUDED.publication,description=EXCLUDED.description,coverage=EXCLUDED.coverage,updated_at=NOW()`; return settings;
}

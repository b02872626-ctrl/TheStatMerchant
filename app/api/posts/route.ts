import { NextResponse } from "next/server";
import { isAdmin } from "../../../lib/auth";
import { hasPersistentStorage, savePost, trashPost } from "../../../lib/content/store";
import type { Post } from "../../../lib/content/types";

export async function POST(request:Request){if(!await isAdmin())return NextResponse.json({error:"Unauthorized"},{status:401});if(!hasPersistentStorage())return NextResponse.json({error:"Publishing storage is not configured yet."},{status:503});const post=await request.json() as Post;if(!post.title?.trim()||!post.slug?.trim())return NextResponse.json({error:"Title and link are required"},{status:400});return NextResponse.json(await savePost(post));}

export async function DELETE(request: Request) {
  if (!await isAdmin()) return NextResponse.json({error: "Unauthorized"}, {status: 401});
  if (!hasPersistentStorage()) return NextResponse.json({error: "Publishing storage is not configured yet."}, {status: 503});

  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({error: "A valid story ID is required."}, {status: 400});

  const trashed = await trashPost(id);
  if (!trashed) return NextResponse.json({error: "Story not found."}, {status: 404});
  return NextResponse.json({ok: true});
}

import { NextResponse } from "next/server";
import { isAdmin } from "../../../lib/auth";
import { hasPersistentStorage, savePost } from "../../../lib/content/store";
import type { Post } from "../../../lib/content/types";

export async function POST(request:Request){if(!await isAdmin())return NextResponse.json({error:"Unauthorized"},{status:401});if(!hasPersistentStorage())return NextResponse.json({error:"Publishing storage is not configured yet."},{status:503});const post=await request.json() as Post;if(!post.title?.trim()||!post.slug?.trim())return NextResponse.json({error:"Title and link are required"},{status:400});return NextResponse.json(await savePost(post));}

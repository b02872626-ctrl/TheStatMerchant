import { NextResponse } from "next/server";
import { isAdmin } from "../../../lib/auth";
import { hasPersistentStorage, saveSettings } from "../../../lib/content/store";
import type { PublicationSettings } from "../../../lib/content/types";
export async function POST(request:Request){if(!await isAdmin())return NextResponse.json({error:"Unauthorized"},{status:401});if(!hasPersistentStorage())return NextResponse.json({error:"Publishing storage is not configured yet."},{status:503});return NextResponse.json(await saveSettings(await request.json() as PublicationSettings));}

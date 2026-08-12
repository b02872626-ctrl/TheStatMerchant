import { NextResponse } from "next/server";
import { isAdmin } from "../../../lib/auth";
import { saveSettings } from "../../../lib/content/store";
import type { PublicationSettings } from "../../../lib/content/types";
export async function POST(request:Request){if(!await isAdmin())return NextResponse.json({error:"Unauthorized"},{status:401});return NextResponse.json(await saveSettings(await request.json() as PublicationSettings));}

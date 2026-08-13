import { NextResponse } from "next/server";
import { adminPasswordMatches, createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "../../../../lib/auth";

export async function POST(request: Request) {
  const { password } = await request.json() as { password?: string };
  if (!password || !adminPasswordMatches(password)) return NextResponse.json({error:"Incorrect password"},{status:401});
  const response=NextResponse.json({ok:true}); response.cookies.set(SESSION_COOKIE,createSessionToken(),sessionCookieOptions); return response;
}

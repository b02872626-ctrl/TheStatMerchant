import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "tsm_admin";
const lifetime = 60 * 60 * 24 * 14;

function secret() { return process.env.ADMIN_SESSION_SECRET || "local-development-only"; }
function signature(value:string) { return createHmac("sha256",secret()).update(value).digest("hex"); }
export function createSessionToken() { const expires=String(Math.floor(Date.now()/1000)+lifetime); return `${expires}.${signature(expires)}`; }
export function verifySessionToken(token?:string) { if(!token) return false; const [expires,sig]=token.split("."); if(!expires||!sig||Number(expires)<Date.now()/1000) return false; const expected=signature(expires); return sig.length===expected.length && timingSafeEqual(Buffer.from(sig),Buffer.from(expected)); }
export async function isAdmin() { return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value); }
export function adminPasswordMatches(value:string) { const expected=process.env.ADMIN_PASSWORD || "admin"; return value.length===expected.length && timingSafeEqual(Buffer.from(value),Buffer.from(expected)); }
export const sessionCookieOptions={httpOnly:true,sameSite:"lax" as const,secure:process.env.NODE_ENV==="production",path:"/",maxAge:lifetime};

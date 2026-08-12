import Studio from "./studio";
import LoginForm from "./login-form";
import { isAdmin } from "../../lib/auth";
import { getPosts, getSettings } from "../../lib/content/store";

export const metadata = { title: "Studio — TheStatMerchant" };

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  if (!await isAdmin()) return <LoginForm />;
  const [posts, settings] = await Promise.all([getPosts(),getSettings()]);
  return <Studio initialPosts={posts} initialSettings={settings} />;
}

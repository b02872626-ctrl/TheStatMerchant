import { notFound, redirect } from "next/navigation";
import { isAdmin } from "../../../../lib/auth";
import { getPost, getPosts, getSettings } from "../../../../lib/content/store";
import StoryView from "../../../stories/story-view";

export const dynamic = "force-dynamic";
export const metadata = { title: "Private preview — TheStatMerchant", robots: { index: false, follow: false } };

export default async function PreviewPage({params}:{params:Promise<{slug:string}>}) {
  if (!await isAdmin()) redirect("/studio");
  const {slug} = await params;
  const [post, settings, allPosts] = await Promise.all([getPost(slug), getSettings(), getPosts()]);
  if (!post) notFound();
  const related = allPosts.filter(item=>item.status==="Published"&&item.slug!==slug).slice(0,3);
  return <StoryView post={post} settings={settings} related={related} preview/>;
}

import { notFound } from "next/navigation";
import { getPublishedPost, getPosts, getSettings } from "../../../lib/content/store";
import StoryView from "../story-view";

export const dynamic = "force-dynamic";

export default async function StoryPage({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params; const [post,settings,allPosts]=await Promise.all([getPublishedPost(slug),getSettings(),getPosts()]); if(!post)notFound();
  const related=allPosts.filter(item=>item.status==="Published"&&item.slug!==slug).slice(0,3);
  return <StoryView post={post} settings={settings} related={related}/>;
}

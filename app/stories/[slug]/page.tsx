import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getPublishedPost, getPosts, getSettings } from "../../../lib/content/store";
import StoryView from "../story-view";

export const dynamic = "force-dynamic";

const getStory = cache(getPublishedPost);

function shareImage(heroImage: string, body: string) {
  const firstBodyImage = body.match(/!\[[^\]]*]\((https:\/\/[^)]+)\)/)?.[1];
  return heroImage || firstBodyImage || "/og.png";
}

function shareDescription(excerpt: string, body: string) {
  if (excerpt.trim()) return excerpt.trim();

  const firstParagraph = body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .find((paragraph) => paragraph && !/^(?:!\[|#|>|\|)/.test(paragraph));

  const plainText = firstParagraph
    ?.replace(/!\[[^\]]*]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return plainText || "Independent football analysis from TheStatMerchant.";
}

export async function generateMetadata({params}:{params:Promise<{slug:string}>}): Promise<Metadata> {
  const {slug} = await params;
  const post = await getStory(slug);
  if (!post) return { title: "Story not found", robots: { index: false, follow: false } };

  const description = shareDescription(post.excerpt, post.body);
  const image = shareImage(post.heroImage, post.body);
  const path = `/stories/${post.slug}`;

  return {
    title: post.title,
    description,
    authors: [{name: post.author}],
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      siteName: "TheStatMerchant",
      title: post.title,
      description,
      url: path,
      images: [{url: image, alt: `${post.title} — TheStatMerchant`}],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: [image],
    },
  };
}

export default async function StoryPage({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params; const [post,settings,allPosts]=await Promise.all([getStory(slug),getSettings(),getPosts()]); if(!post)notFound();
  const related=allPosts.filter(item=>item.status==="Published"&&item.slug!==slug).slice(0,3);
  return <StoryView post={post} settings={settings} related={related}/>;
}

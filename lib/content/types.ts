export type PostStatus = "Published" | "Draft";

export type Post = {
  id: number;
  title: string;
  slug: string;
  status: PostStatus;
  date: string;
  reads: string;
  views: number;
  readTime: string;
  excerpt: string;
  body: string;
  author: string;
  heroImage: string;
};

export type PublicationSettings = {
  author: string;
  publication: string;
  description: string;
  coverage: string;
};

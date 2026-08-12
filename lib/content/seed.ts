import type { Post, PublicationSettings } from "./types";

export const seedSettings: PublicationSettings = {
  author: "Nahu M.",
  publication: "TheStatMerchant",
  description: "Sharp Premier League analysis, built for the group chat.",
  coverage: "Premier League and world football",
};

export const seedPosts: Post[] = [
  { id: 1, title: "Why the Premier League’s best wingers are moving inside", slug: "inside-forwards-premier-league", status: "Published", date: "12 Aug 2026", reads: "4.8k", views: 4826, readTime: "6m 18s", excerpt: "The touchline winger is disappearing. Here is what is replacing him — and why it is so difficult to defend.", body: "For most of football history, the winger’s instructions could be drawn as a straight line. Stay wide. Beat the full-back. Reach the byline. Deliver.\n\nThe modern Premier League has bent that line until it points directly at goal.\n\n## The defender’s impossible choice\n\nWhen a right-footed attacker receives on the left, the opposition full-back must choose between two bad outcomes. Show him outside and concede the cross. Show him inside and open the route to goal.\n\n> The winger is no longer escaping the system. He is the point where the system becomes unpredictable.\n\n## Width is a starting point, not a destination\n\nCoaches still want the pitch stretched, but the player providing that width has changed. The next generation of Premier League winger will still wear a familiar number. Their map will tell another story.", author: "Nahu M.", heroImage: "/inside-forward.png" },
  { id: 2, title: "The £40m midfielder hiding in plain sight", slug: "midfielder-hiding-in-plain-sight", status: "Draft", date: "Edited 2h ago", reads: "—", views: 0, readTime: "—", excerpt: "A data-led look at the league's most undervalued controller.", body: "", author: "Nahu M.", heroImage: "" },
  { id: 3, title: "Five set-piece trends to watch this season", slug: "five-set-piece-trends", status: "Published", date: "8 Aug 2026", reads: "7.1k", views: 7119, readTime: "5m 42s", excerpt: "From blocker screens to crowding the goalkeeper, the details shaping dead balls.", body: "Set pieces are no longer a pause between phases. They are designed attacks with their own specialists, decoys and repeatable patterns.", author: "Nahu M.", heroImage: "/inside-forward.png" },
];

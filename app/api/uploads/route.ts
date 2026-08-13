import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { isAdmin } from "../../../lib/auth";

const allowedContentTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

export async function POST(request: Request) {
  const body = await request.json() as HandleUploadBody;

  if (body.type === "blob.generate-client-token" && !await isAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith("articles/")) throw new Error("Invalid upload path.");
        return {
          allowedContentTypes,
          maximumSizeInBytes: 10 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "The image could not be uploaded.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// Creator storefront — dynamic per influencer, themed per template
// Sprint IV: added generateMetadata for per-creator SEO
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import AnalyticsCapture from "@/components/AnalyticsCapture";
import StorefrontShell from "@/components/StorefrontShell";
import { getTemplate, type TemplateId } from "@/lib/templates";

// Server-side: use internal URL to avoid Cloudflare loopback; client-side uses public URL
const API_URL = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8200";

async function getCreatorData(handle: string) {
  try {
    const res = await fetch(API_URL + "/influencers?handle=" + handle, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    // API returns array when filtering by handle
    const creator = Array.isArray(data) ? data[0] : data;
    if (!creator || !creator.id) return null;
    return creator;
  } catch {
    return null;
  }
}

async function getInfluencerProducts(influencerId: string) {
  try {
    const res = await fetch(
      API_URL + "/products?influencer_id=" + influencerId + "&status=active&limit=100",
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// Dynamic OG/SEO metadata per creator
export async function generateMetadata({
  params,
}: {
  params: { creator: string };
}): Promise<Metadata> {
  const creator = await getCreatorData(params.creator);
  if (!creator) return { title: `@${params.creator} | Yes MAM` };

  const handle = creator.handle || params.creator;
  const displayName = creator.name || `@${handle}`;
  const title = `${displayName}'s Store | Yes MAM`;
  const description = creator.bio
    ? `${creator.bio} · Shop ${displayName}'s curated collection on Yes MAM.`
    : `Shop @${handle}'s curated collection on Yes MAM — Africa's creator commerce platform. Pay on delivery.`;
  const image = creator.avatar_url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "Yes MAM",
      type: "website",
      images: image ? [{ url: image, width: 400, height: 400, alt: displayName }] : [],
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function CreatorStorefront({
  params,
  searchParams,
}: {
  params: { creator: string };
  searchParams: { t?: string };
}) {
  const handle = params.creator;
  const creator = await getCreatorData(handle);
  if (!creator) notFound();

  // Load products assigned to this influencer via campaigns (empty array if none assigned)
  const products = creator.id ? await getInfluencerProducts(creator.id) : [];

  // Template priority: URL ?t= param (preview) > influencer record > default
  const templateId =
    (searchParams.t as TemplateId | undefined) ||
    creator.template_id ||
    "glow";
  const template = getTemplate(templateId);

  return (
    <>
      <Suspense fallback={null}>
        <AnalyticsCapture
          eventName="storefront.viewed"
          entityType="influencer"
          creatorHandle={handle}
        />
      </Suspense>
      <StorefrontShell
        creator={creator}
        handle={handle}
        products={products}
        template={template}
        previewMode={!!searchParams.t}
      />
    </>
  );
}

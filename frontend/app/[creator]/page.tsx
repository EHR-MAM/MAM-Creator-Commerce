// Creator storefront — dynamic per influencer, themed per template
import { notFound } from "next/navigation";
import { Suspense } from "react";
import AnalyticsCapture from "@/components/AnalyticsCapture";
import StorefrontShell from "@/components/StorefrontShell";
import { getTemplate, type TemplateId } from "@/lib/templates";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

async function getCampaignProducts(campaignId: string) {
  try {
    const res = await fetch(
      API_URL + "/products?campaign_id=" + campaignId + "&status=active",
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
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

  const products = creator.campaign_id
    ? await getCampaignProducts(creator.campaign_id)
    : [];

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

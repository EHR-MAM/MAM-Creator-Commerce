"use client";
// AnalyticsCapture — fires a storefront_view event with UTM / ref params
// Mount this at the top of any public-facing page (storefront, product page).
// It reads the URL query string for ref, utm_source, utm_medium, utm_campaign
// and posts to POST /analytics/events so admin can see attribution data.
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8200";

interface Props {
  eventName?: string;
  entityType?: string;
  entityId?: string;
  creatorHandle?: string;
}

export default function AnalyticsCapture({
  eventName = "storefront.viewed",
  entityType,
  entityId,
  creatorHandle,
}: Props) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    const utm_source = searchParams.get("utm_source");
    const utm_medium = searchParams.get("utm_medium");
    const utm_campaign = searchParams.get("utm_campaign");

    fetch(`${API_URL}/analytics/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: eventName,
        entity_type: entityType,
        entity_id: entityId,
        payload: {
          creator_handle: creatorHandle,
          ref,
          utm_source: utm_source || (ref ? "tiktok" : "direct"),
          utm_medium: utm_medium || (ref ? "social" : "direct"),
          utm_campaign,
          page_url: window.location.href,
          referrer: document.referrer || null,
        },
      }),
    }).catch(() => {
      // Analytics capture is non-critical — swallow errors silently
    });
  }, []);  // fire once on mount

  return null;  // no UI
}

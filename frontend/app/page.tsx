// MAM Home — redirects to Christiana's storefront or shows platform landing
import { redirect } from "next/navigation";

// During pilot: redirect root to Christiana's storefront
export default function Home() {
  redirect("/sweet200723");
}

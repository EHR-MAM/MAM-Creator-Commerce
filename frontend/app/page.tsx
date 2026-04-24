// Root route: show the Yes MAM home/landing page
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/shop");
}

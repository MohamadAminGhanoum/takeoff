import DocRenderer from "@/components/docs/DocRenderer";
import { getDocBySlug } from "@/lib/docs/content";

export default function DocsIndexPage() {
  const page = getDocBySlug("flight-briefing");
  return <DocRenderer page={page} />;
}
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DocRenderer from "@/components/docs/DocRenderer";
import { DOC_PAGES, findDocStrict } from "@/lib/docs/content";

export function generateStaticParams() {
  return DOC_PAGES.filter((p) => p.slug !== "flight-briefing").map((p) => ({
    slug: [p.slug],
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = findDocStrict(slug[0]);
  if (!page) return { title: "Not Found | Takeoff Docs" };
  return {
    title: `${page.title} | Takeoff Docs`,
    description: page.description,
  };
}

export default async function DocSlugPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  if (slug.length !== 1) notFound();
  const page = findDocStrict(slug[0]);
  if (!page) notFound();

  return <DocRenderer page={page} />;
}
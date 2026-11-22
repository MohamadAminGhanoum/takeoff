import type { Metadata } from "next";
import DocsShell from "@/components/docs/DocsShell";

export const metadata: Metadata = {
  title: "Flight Manual | Takeoff Docs",
  description:
    "Guides, rules, starter aviation projects, and shipping checklists for Takeoff.",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DocsShell>{children}</DocsShell>;
}
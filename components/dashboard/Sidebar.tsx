"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const tabs = [
  { label: "Projects", href: "/dashboard/projects" },
  { label: "Resources", href: "/dashboard/resources" },
  { label: "Shop", href: "/dashboard/shop" },
];

export default function Sidebar({
  user,
}: {
  user: { name: string; email: string; image: string | null };
}) {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-slate-800 bg-slate-900/50 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <Link href="/dashboard" className="text-sky-300 font-bold tracking-widest">
          TAKEOFF
        </Link>
      </div>

      {/* Nav tabs */}
      <nav className="flex-1 p-4 space-y-1">
        {tabs.map((t) => {
          const active = pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-sky-500/20 text-sky-300"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      {/* User profile at bottom */}
      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center gap-3">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt={user.name}
              className="h-9 w-9 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="h-9 w-9 rounded-full bg-sky-500 flex items-center justify-center font-semibold shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">{user.name}</div>
            <div className="text-xs text-slate-500 truncate">{user.email}</div>
          </div>
        </div>
        <button
          onClick={async () => {
            const csrfResponse = await fetch("/api/auth/csrf");
            const { csrfToken } = await csrfResponse.json();
            await fetch("/api/auth/signout", {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({ csrfToken, callbackUrl: "/" }),
            });
            window.location.assign("/");
          }}
          className="mt-3 w-full rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
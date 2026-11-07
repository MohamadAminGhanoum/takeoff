import CheckPanel from "@/components/checker/CheckPanel";
import { aiConfigured } from "@/lib/checker/ai";

export default function RepoCheckPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Repo check</h1>
        <p className="mt-1 text-sm text-slate-400">
          Paste a public GitHub repo to see how it holds up. The results are hints for a
          person to follow up on, not a decision.
        </p>
      </div>
      <CheckPanel askForDetails aiAvailable={aiConfigured()} />
    </div>
  );
}

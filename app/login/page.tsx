import { signIn } from "@/auth";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="text-4xl font-bold text-sky-300">Sign in to Takeoff</h1>
        <p className="mt-3 text-slate-400">
          We use Hack Club Auth. One account for every Hack Club program.
        </p>
        <form
          action={async () => {
            "use server";
            await signIn("hackclub", { redirectTo: "/dashboard" });
          }}
        >
          <button
            type="submit"
            className="mt-8 w-full rounded-lg bg-sky-500 px-6 py-3 font-semibold text-white hover:bg-sky-400 transition"
          >
            Continue with Hack Club
          </button>
        </form>
        <a
          href="/"
          className="mt-6 inline-block text-sm text-slate-500 hover:text-sky-400"
        >
          ← Back to home
        </a>
      </div>
    </main>
  );
}
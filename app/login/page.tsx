import { signIn } from "@/auth";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-950 px-6 text-white">
      <h1 className="bg-gradient-to-r from-sky-300 to-blue-400 bg-clip-text text-5xl font-bold text-transparent">
        Takeoff
      </h1>
      <p className="text-slate-400">Sign in with your Hack Club account.</p>
      <form
        action={async () => {
          "use server";
          await signIn("hackclub", { redirectTo: "/dashboard" });
        }}
      >
        <button className="rounded-md bg-sky-500 px-8 py-3 font-semibold text-white transition hover:scale-105 hover:bg-sky-400">
          Sign in with Hack Club
        </button>
      </form>
    </main>
  );
}
import NextAuth from "next-auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    {
      id: "hackclub",
      name: "Hack Club",
      type: "oidc",
      issuer: "https://auth.hackclub.com",
      clientId: process.env.HACKCLUB_CLIENT_ID!,
      clientSecret: process.env.HACKCLUB_CLIENT_SECRET!,
      authorization: {
params: { scope: "openid profile" },
      },
      profile(profile: any) {
        const id = profile.identity ?? profile;
        return {
          id: String(id.id ?? id.sub ?? ""),
          name:
            [id.first_name, id.last_name].filter(Boolean).join(" ") ||
            id.name ||
            "Hacker",
          email: id.primary_email ?? id.email ?? "",
          image: id.avatar_url ?? id.profile_picture ?? null,
        };
      },
    },
  ],
  pages: { signIn: "/login" },
});
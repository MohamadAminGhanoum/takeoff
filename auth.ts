import NextAuth from "next-auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
      trustHost: true,
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
      profile(profile: {
        identity?: {
          id?: string | number;
          sub?: string;
          first_name?: string;
          last_name?: string;
          name?: string;
          primary_email?: string;
          email?: string;
          avatar_url?: string;
          profile_picture?: string;
        };
        id?: string | number;
        sub?: string;
        first_name?: string;
        last_name?: string;
        name?: string;
        primary_email?: string;
        email?: string;
        avatar_url?: string;
        profile_picture?: string;
      }) {
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
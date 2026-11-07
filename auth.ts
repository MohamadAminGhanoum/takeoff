/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth from "next-auth";
import type { Account, Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";

const HC = "https://auth.hackclub.com";

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const res = await fetch(`${HC}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.HACKCLUB_CLIENT_ID,
        client_secret: process.env.HACKCLUB_CLIENT_SECRET,
        refresh_token: token.refresh_token,
        grant_type: "refresh_token",
      }),
    });
    const data = await res.json();
    if (!res.ok) throw data;

    return {
      ...token,
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? token.refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
      error: undefined,
    };
  } catch (e) {
    console.error("HC token refresh failed", e);
    return { ...token, error: "RefreshTokenError" };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    {
      id: "hackclub",
      name: "Hack Club",
      type: "oidc",
      issuer: HC,
      clientId: process.env.HACKCLUB_CLIENT_ID,
      clientSecret: process.env.HACKCLUB_CLIENT_SECRET,
      authorization: {
        params: { scope: "openid profile email slack_id verification_status" },
      },
      profile(profile: Record<string, any>) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.slack_id
            ? `https://cachet.dunkirk.sh/users/${profile.slack_id}/r`
            : null,
          slack_id: profile.slack_id,
          verification_status: profile.verification_status,
          ysws_eligible: profile.ysws_eligible,
        };
      },
    },
  ],
  callbacks: {
    async jwt({
      token,
      user,
      account,
    }: {
      token: JWT;
      user?: User;
      account?: Account | null;
    }) {
      if (account && user) {
        return {
          ...token,
          access_token: account.access_token,
          refresh_token: account.refresh_token,
          expires_at:
            account.expires_at ??
            Math.floor(Date.now() / 1000) + (Number(account.expires_in) || 0),
          slack_id: user.slack_id,
          verification_status: user.verification_status,
          ysws_eligible: user.ysws_eligible,
        };
      }

      if (
        typeof token.expires_at === "number" &&
        Date.now() < (token.expires_at - 60) * 1000
      ) {
        return token;
      }

      if (token.refresh_token) return refreshAccessToken(token);
      return token;
    },
    session({ session, token }: { session: Session; token: JWT }) {
      session.user.id = token.sub as string;
      session.accessToken = token.access_token;
      session.error = token.error;
      session.user.slack_id = token.slack_id;
      session.user.verification_status = token.verification_status;
      session.user.ysws_eligible = token.ysws_eligible;
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
});
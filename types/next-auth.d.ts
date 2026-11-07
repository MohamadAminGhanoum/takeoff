import type { DefaultSession } from "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    slack_id?: string;
    verification_status?: string;
    ysws_eligible?: boolean;
  }

  interface Session {
    accessToken?: string;
    error?: string;
    user: {
      id: string;
      slack_id?: string;
      verification_status?: string;
      ysws_eligible?: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
    error?: string;
    slack_id?: string;
    verification_status?: string;
    ysws_eligible?: boolean;
  }
}
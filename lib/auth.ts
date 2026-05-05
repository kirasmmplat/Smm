import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyTOTP } from "@/lib/totp";
import { createAuditLog } from "@/lib/audit";
import bcrypt from "bcryptjs";
import { checkRateLimit } from "@/lib/rate-limit";

const isHTTPS = process.env.NEXTAUTH_URL?.startsWith("https://") ?? true;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        twoFactorCode: { label: "2FA Code", type: "text" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        const ip =
          (req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
          (req?.headers?.["x-real-ip"] as string) ??
          "unknown";
        const rl = checkRateLimit(`login:${ip}`, 5, 15 * 60 * 1000);
        if (!rl.success) throw new Error("RATE_LIMIT");

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { accountLevel: true },
        });

        if (!user) {
          void createAuditLog({ action: "LOGIN_FAILED", userEmail: credentials.email, ip, severity: "WARNING", details: { reason: "user_not_found" } });
          return null;
        }
        if (user.status !== "ACTIVE") {
          void createAuditLog({ action: "LOGIN_FAILED", userId: user.id, userEmail: user.email, ip, severity: "WARNING", details: { reason: "account_" + user.status.toLowerCase() } });
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          void createAuditLog({ action: "LOGIN_FAILED", userId: user.id, userEmail: user.email, ip, severity: "WARNING", details: { reason: "invalid_password" } });
          return null;
        }

        if (user.twoFactorEnabled) {
          if (!credentials.twoFactorCode?.trim()) {
            throw new Error("TWO_FACTOR_REQUIRED");
          }
          if (!user.twoFactorSecret) {
            throw new Error("TWO_FACTOR_REQUIRED");
          }
          const isValidCode = verifyTOTP(credentials.twoFactorCode.trim(), user.twoFactorSecret);
          if (!isValidCode) {
            void createAuditLog({ action: "LOGIN_FAILED", userId: user.id, userEmail: user.email, ip, severity: "WARNING", details: { reason: "invalid_2fa" } });
            throw new Error("TWO_FACTOR_INVALID");
          }
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        void createAuditLog({ action: "LOGIN", userId: user.id, userEmail: user.email, ip, severity: "INFO", details: { role: user.role } });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          username: user.username,
          balance: user.balance.toString(),
          discountPercent: user.discountPercent,
          accountLevel: user.accountLevel?.name ?? "جديد",
        };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isHTTPS,
      },
    },
    callbackUrl: {
      name: "next-auth.callback-url",
      options: {
        httpOnly: false,
        sameSite: "lax",
        path: "/",
        secure: isHTTPS,
      },
    },
    csrfToken: {
      name: "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isHTTPS,
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.username = (user as any).username;
        token.balance = (user as any).balance;
        token.discountPercent = (user as any).discountPercent;
        token.accountLevel = (user as any).accountLevel;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.username = token.username as string;
        session.user.balance = token.balance as string;
        session.user.discountPercent = token.discountPercent as number;
        session.user.accountLevel = token.accountLevel as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET ?? process.env.SESSION_SECRET,
};

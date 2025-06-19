import { NextAuthOptions, DefaultSession } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import type { Adapter } from "next-auth/adapters"

// Import UserRole from Prisma client
type UserRole = "USER" | "ADMIN" | "ORGANIZATION_ADMIN"

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string
      role: UserRole
      organizationId?: string
    } & DefaultSession["user"]
  }

  interface User {
    role: UserRole
    organizationId?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole
    organizationId?: string
  }
}

// Build providers array conditionally
const buildProviders = () => {
  const providers = [];
  
  // Add OAuth providers only if credentials are configured
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }));
  }
  
  if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
    providers.push(GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }));
  }
  
  // Always include credentials provider
  providers.push(CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null
      }

      const user = await prisma.user.findUnique({
        where: {
          email: credentials.email,
        },
        include: {
          profile: true,
          organization: true,
        },
      })

      if (!user) {
        return null
      }

      // For OAuth users without password
      if (!user.profile?.hashedPassword) {
        return null
      }

      const isPasswordValid = await bcrypt.compare(
        credentials.password,
        user.profile.hashedPassword
      )

      if (!isPasswordValid) {
        return null
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
        organizationId: user.organizationId || undefined,
      }
    },
  }));
  
  return providers;
};

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: buildProviders(),
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.organizationId = user.organizationId
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role
        session.user.organizationId = token.organizationId
      }
      return session
    },
    async signIn({ user, account }) {
      // For OAuth providers, create user profile if it doesn't exist
      if (account?.provider !== "credentials" && user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { profile: true },
        })

        if (existingUser && !existingUser.profile) {
          await prisma.userProfile.create({
            data: {
              userId: existingUser.id,
              firstName: user.name?.split(' ')[0] || undefined,
              lastName: user.name?.split(' ').slice(1).join(' ') || undefined,
            },
          })
        }
      }
      return true
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
}

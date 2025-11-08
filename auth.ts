import NextAuth from "next-auth"
import { prisma } from "@/lib/prisma"
import { authConfig } from "./auth.config"
import { logUserLogin } from "@/lib/actions/audit-log-actions"

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  session: { 
    strategy: "jwt",
    maxAge: 60, // 60 seconds
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60, // 60 seconds - expires after 60 seconds of inactivity
      },
    },
  },
  pages: {
    signIn: "/auth/sign-in",
    error: "/auth/error",
    signOut: "/auth/sign-in"
  },
  ...authConfig,
  callbacks: {
    async signIn({ user }) {
      if (!user?.id) return false;
      
      // Check if user exists in database
      const existingUser = await prisma.user.findUnique({ 
        where: { id: user.id } 
      });
      
      if (!existingUser) return false;
      
      // Update last login timestamp
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });
      
      // Log the login event to audit logs
      await logUserLogin(user.id);
      
      return true;
    },
    
    async jwt({ token, user }) {
      // If user is signing in, add user data to token
      if (user) {
        token.id = user.id;
        token.employeeId = user.employeeId;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.classification = user.classification;
        token.businessUnit = user.businessUnit;
        token.department = user.department;
      }
      return token;
    },
    
    async session({ session, token }) {
      // Send properties to the client
      if (token && token.id) {
        return {
          ...session,
          user: {
            id: token.id as string,
            employeeId: token.employeeId as string,
            email: token.email as string | null,
            name: token.name as string,
            role: token.role as typeof session.user.role,
            classification: token.classification as typeof session.user.classification,
            businessUnit: token.businessUnit as typeof session.user.businessUnit,
            department: token.department as typeof session.user.department,
          }
        };
      }
      return session;
    },
  },
});
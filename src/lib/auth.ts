import { NextAuthOptions } from 'next-auth'
import LineProvider from 'next-auth/providers/line'
import connectDB from './db'
import User from '@/models/User'

type Role = 'ADMIN' | 'CUSTOMER' | 'OWNER' | 'EMPLOYEE'

const SESSION_MAX_AGE = 30 * 24 * 60 * 60 // 30 days

// JWT sessions; users are stored in Firestore by the signIn callback
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    LineProvider({
      clientId: process.env.LINE_CHANNEL_ID || '',
      clientSecret: process.env.LINE_CHANNEL_SECRET || '',
      authorization: { params: { scope: 'profile openid email' } },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== 'line') return true

      try {
        await connectDB()
        const lineUserId = (profile as { sub?: string } | undefined)?.sub || user.id

        // LINE user id is the stable identifier; create the user on first sign-in
        const dbUser = await User.findOneAndUpdate(
          { lineUserId },
          { name: user.name || 'LINE User', image: user.image || '', email: user.email || '', lineUserId },
          { new: true, upsert: true }
        )

        user.id = dbUser._id
        user.role = dbUser.role
        user.lineUserId = dbUser.lineUserId
      } catch (error) {
        // Don't block sign-in; API routes fall back to looking the user up by LINE id
        console.error('Error saving LINE user:', error)
      }
      return true
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role || 'CUSTOMER'
        token.lineUserId = user.lineUserId
        return token
      }

      // Tokens issued without a role (e.g. when the DB write failed at sign-in) pick it up later
      if (token.id && !token.role) {
        try {
          await connectDB()
          const dbUser = await User.findById(String(token.id))
          if (dbUser) token.role = dbUser.role || 'CUSTOMER'
        } catch (error) {
          console.error('Error fetching user role:', error)
        }
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? '')
        session.user.role = (token.role as Role) || 'CUSTOMER'
        session.user.lineUserId = token.lineUserId as string | undefined
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
    maxAge: SESSION_MAX_AGE,
    updateAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: SESSION_MAX_AGE,
      },
    },
  },
  debug: process.env.NODE_ENV === 'development',
}

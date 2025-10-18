import { NextAuthOptions } from 'next-auth'
import { MongoDBAdapter } from '@next-auth/mongodb-adapter'
import LineProvider from 'next-auth/providers/line'
import connectDB from './mongodb'
import { MongoClient } from 'mongodb'

const client = new MongoClient(process.env.DATABASE_URL!)
const clientPromise = client.connect()

async function refreshAccessToken(token: any) {
  try {
    // For LINE provider, we don't need to refresh the token
    // Just return the existing token
    return token
  } catch (error) {
    console.error('Error refreshing access token:', error)
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    }
  }
}

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    LineProvider({
      clientId: process.env.LINE_CHANNEL_ID || 'dummy',
      clientSecret: process.env.LINE_CHANNEL_SECRET || 'dummy',
      authorization: {
        params: {
          scope: 'profile openid email',
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {      
      try {
        if (session.user && token) {
          session.user.id = token.id as string
          session.user.role = token.role as string || 'CUSTOMER'
          session.user.lineUserId = token.lineUserId as string
        }
        return session
      } catch (error) {
        console.error('Error in session callback:', error)
        return session
      }
    },
    async jwt({ token, user, account }) {      
      // Initial sign in
      if (account && user) {
        token.accessToken = account.access_token
        token.id = user.id
        token.role = (user as any).role || 'CUSTOMER'
        token.lineUserId = (user as any).lineUserId
        return token
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token
      }

      // Access token has expired, try to update it
      return await refreshAccessToken(token)
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === 'line') {        
        try {
          await connectDB()
          const { default: User } = await import('@/models/User')
          
          // Find or create user
          const existingUser = await User.findOneAndUpdate(
            { email: user.email },
            { 
              name: user?.name || '', 
              image: user?.image || '', 
              email: user?.email || '', 
              role: 'ADMIN',
              lineUserId: (profile as any)?.sub || user.id
            },
            {
              new: true,
              upsert: true
            }
          )
          
          // Update user object with database data
          user.id = existingUser._id.toString()
          user.role = existingUser.role
          user.lineUserId = existingUser.lineUserId
          
        } catch (error) {
          console.error('Error updating user LINE ID:', error)
          // Don't fail the sign-in process if this fails
        }
      }
      return true
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      },
    },
  },
  debug: process.env.NODE_ENV === 'development',
}
import { NextAuthOptions } from 'next-auth'
import LineProvider from 'next-auth/providers/line'
import connectDB from './db'
import { isFirebaseConfigured } from './firebase'

type Role = 'ADMIN' | 'CUSTOMER' | 'OWNER' | 'EMPLOYEE'

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
  // JWT session strategy - users are stored in Firestore by the signIn callback below
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
          // Convert token.id to string if needed
          const tokenId = token.id ? String(token.id) : undefined
          
          session.user.id = tokenId as string
          session.user.role = ((token.role as string) || 'CUSTOMER') as Role
          session.user.lineUserId = token.lineUserId as string
          
          console.log('🔍 Session callback - Setting user data:', {
            id: session.user.id,
            role: session.user.role,
            tokenId: token.id,
            tokenIdType: typeof token.id
          })
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

      // On subsequent requests, fetch fresh user data from DB if role is missing
      if (token && token.id && !token.role && isFirebaseConfigured()) {
        try {
          await connectDB()
          const { default: User } = await import('@/models/User')
          const userFromDb = await User.findById(token.id)
          if (userFromDb) {
            token.role = userFromDb.role || 'CUSTOMER'
          }
        } catch (error) {
          console.error('Error fetching user role:', error)
        }
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
          
          const lineUserId = (profile as any)?.sub || user.id
          
          // Find or create user by lineUserId (LINE's primary identifier)
          const existingUser = await User.findOneAndUpdate(
            { lineUserId: lineUserId },
            { 
              name: user?.name || 'LINE User', 
              image: user?.image || '', 
              email: user?.email || '', 
              // role: 'CUSTOMER', // Default to CUSTOMER role for new users
              lineUserId: lineUserId
            },
            {
              new: true,
              upsert: true
            }
          )
          
          // Update user object with database data
          user.id = existingUser?._id
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
  debug: true,
}
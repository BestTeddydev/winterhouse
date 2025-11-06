import NextAuth from 'next-auth'

type Role = 'ADMIN' | 'CUSTOMER' | 'OWNER' | 'EMPLOYEE'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: Role
      lineUserId?: string | null
    }
  }

  interface User {
    role: Role
    lineUserId?: string | null
  }
}


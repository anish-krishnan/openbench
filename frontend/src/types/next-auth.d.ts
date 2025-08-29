/**
 * NextAuth type extensions
 */

import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    accessToken?: string
    provider?: string
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      username?: string
      avatar?: string
    }
  }

  interface User {
    username?: string
    avatar?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
    provider?: string
    username?: string
    avatar?: string
  }
}

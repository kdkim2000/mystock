import 'server-only'
import { type AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { env } from './env'

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    signIn({ user }) {
      if (env.ALLOWED_EMAIL && user.email !== env.ALLOWED_EMAIL) {
        return false
      }
      return true
    },
    jwt({ token, user }) {
      if (user) {
        token.email = user.email
      }
      return token
    },
    session({ session, token }) {
      session.user.email = token.email as string
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  secret: env.AUTH_SECRET,
}

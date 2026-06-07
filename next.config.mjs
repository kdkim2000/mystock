/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['googleapis', 'openai'],
  experimental: {
    outputFileTracingExcludes: {
      '*': [
        '**/@swc/core*',
        '**/node_modules/sharp/**',
        '**/node_modules/canvas/**',
      ]
    }
  }
}

export default nextConfig

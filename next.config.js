/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  env: {
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN
  },
  // Añadir optimizaciones
  poweredByHeader: false,
  reactStrictMode: true
};

module.exports = nextConfig; 
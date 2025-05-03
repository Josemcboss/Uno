/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.externals = [...config.externals, 'socket.io-client'];
    return config;
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  // Añadir optimizaciones
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true
};

module.exports = nextConfig; 
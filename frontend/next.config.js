/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/processor/:path*',
        destination: 'http://processor:8001/:path*',
      },
      {
        source: '/api/splunk/:path*',
        destination: 'http://splunk:8000/:path*',
      },
    ];
  },
};

module.exports = nextConfig;

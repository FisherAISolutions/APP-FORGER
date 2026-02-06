/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['openai'],
  allowedDevOrigins: ['*'],
  env: {
    PORT: '5000'
  }
};

export default nextConfig;

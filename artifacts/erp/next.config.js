/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["lottie.host", "utfs.io"],
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ["@neondatabase/serverless"],
  },
};
module.exports = nextConfig;

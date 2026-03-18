/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  basePath: "/mam",
  // Allow images from the API server
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sensedirector.com",
      },
    ],
  },
};

module.exports = nextConfig;

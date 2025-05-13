const { withStoreConfig } = require("./store-config")
const store = require("./store.config.json")
const dotenv = require("dotenv")
const path = require("path")

// Load the environment variables from the root directory
dotenv.config({ path: path.resolve(__dirname, "../.env") })

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  env: {
    FEATURE_SEARCH_ENABLED: store.features.search ? "true" : "false",
    PORT: process.env.PORT || 8000,
  },
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "medusa-public-images.s3.eu-west-1.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.us-east-1.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.us-east-2.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.us-west-1.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.us-west-2.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.ap-south-1.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.ap-northeast-1.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.ap-northeast-2.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.ap-southeast-1.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.ap-southeast-2.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.ca-central-1.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.eu-central-1.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.eu-west-1.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.eu-west-2.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.eu-west-3.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.sa-east-1.amazonaws.com",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    serverActions: true,
  },
  // Ensure the app is accessible from any host
  hostname: '0.0.0.0',
  // Increase the timeout for the health check
  serverTimeout: 30000,
}

console.log("next.config.js", JSON.stringify(module.exports, null, 2))

module.exports = nextConfig

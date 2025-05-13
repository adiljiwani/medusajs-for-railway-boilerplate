const { withStoreConfig } = require("./store-config")
const store = require("./store.config.json")
const dotenv = require("dotenv")
const path = require("path")

// Load the environment variables from the root directory
dotenv.config({ path: path.resolve(__dirname, "../.env") })

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = withStoreConfig({
  features: {
    search: store.features.search ? "true" : "false"
  },
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "medusa-public-images.s3.eu-west-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.us-east-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "bngproducts.s3.us-east-2.amazonaws.com",
      }
    ],
  },
})

console.log("next.config.js", JSON.stringify(module.exports, null, 2))

module.exports = nextConfig

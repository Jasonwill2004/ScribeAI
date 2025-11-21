/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disabled to prevent socket destruction on component re-mount
  swcMinify: true,
}

module.exports = nextConfig

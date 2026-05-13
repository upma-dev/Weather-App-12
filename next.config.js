/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["openweathermap.org"],
  },
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
    OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
};

module.exports = nextConfig;

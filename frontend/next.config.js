/** @type {import('next').NextConfig} */
const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

if (process.env.NODE_ENV === "production" && !process.env.BACKEND_URL) {
  console.warn(
    "[next.config] BACKEND_URL is not set — /api rewrites will target " +
      "http://127.0.0.1:8000. Set BACKEND_URL to your deployed Python API URL.",
  );
}

const nextConfig = {
  output: "standalone",
  async rewrites() {
    // fallback: only proxy to the Python service when no local route handler
    // matches. Auth (/api/auth/*) and the BFF (/api/v1/*) are local.
    return {
      fallback: [
        { source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` },
        { source: "/health", destination: `${BACKEND_URL}/health` },
      ],
    };
  },
};
module.exports = nextConfig;

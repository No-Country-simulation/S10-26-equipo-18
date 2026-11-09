/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      // Fallbacks para herramientas y navegadores que piden los iconos en la raíz.
      { source: "/favicon.ico", destination: "/favicon/favicon.ico" },
      {
        source: "/apple-touch-icon.png",
        destination: "/favicon/apple-touch-icon.png",
      },
      {
        source: "/site.webmanifest",
        destination: "/favicon/site.webmanifest",
      },
    ];
  },
};

export default nextConfig;

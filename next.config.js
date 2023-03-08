/** @type {import('next').NextConfig} */
const nextConfig = {
    basePath: "/robertcorponoi.com",
    output: "export",
    images: {
        unoptimized: true,
    },
    reactStrictMode: true,
};

module.exports = nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
    basePath: "/robertcorponoi.github.io",
    output: "export",
    images: {
        unoptimized: true,
    },
    reactStrictMode: true,
};

module.exports = nextConfig;

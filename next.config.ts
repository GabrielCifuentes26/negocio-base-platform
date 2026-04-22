import type { NextConfig } from "next";

const explicitBasePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const githubRepository = process.env.GITHUB_REPOSITORY?.split("/")[1] || "";
const inferredBasePath =
  process.env.GITHUB_ACTIONS === "true" &&
  githubRepository &&
  !githubRepository.endsWith(".github.io")
    ? `/${githubRepository}`
    : "";
const basePath = explicitBasePath || inferredBasePath;

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath,
  assetPrefix: basePath || undefined,
};

export default nextConfig;

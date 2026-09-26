/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep M0's "build doesn't gate on types" behavior. (Next.js 16 no longer
  // runs ESLint during `next build`, so the old `eslint.ignoreDuringBuilds`
  // option is gone — adding it only triggers an "invalid config" warning.)
  typescript: { ignoreBuildErrors: true },
};
export default nextConfig;

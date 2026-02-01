import "@my-better-t-app/env/web";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	output: "standalone", // Required for AWS Amplify SSR deployment
	typedRoutes: true,
	reactCompiler: true,
	transpilePackages: ["shiki"],
	experimental: {
		serverActions: {
			bodySizeLimit: "10mb", // Allow larger payloads for image uploads
		},
	},
	typescript: {
		ignoreBuildErrors: true,
	},
	// Empty turbopack config to acknowledge Turbopack usage
	turbopack: {},
};

export default nextConfig;

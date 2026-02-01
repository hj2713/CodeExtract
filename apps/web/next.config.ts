import "@my-better-t-app/env/web";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	typedRoutes: true,
	reactCompiler: true,
	transpilePackages: ["shiki"],
	experimental: {
		serverActions: {
			bodySizeLimit: "10mb", // Allow larger payloads for image uploads
		},
	},
};

export default nextConfig;

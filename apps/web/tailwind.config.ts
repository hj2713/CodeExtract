import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "!./src/app/partner/backwards/prototypes/fetch-model-and-req/created-apps/**",
  ],
};

export default config;

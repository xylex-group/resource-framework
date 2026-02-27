import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/**/components/**/*.{ts,tsx,js,jsx}",
    "../../packages/**/hooks/**/*.{ts,tsx,js,jsx}"
  ],
  theme: {
    extend: {}
  },
  plugins: []
};

export default config;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {},
    colors: {
        "night-0": "#111419",
        "night-1": "#1e1d2b",
        "night-2": "#29273d",
        "night-3": "#323049",
        "night-text": "#cee9ef",
    },
  },
  plugins: [],
};

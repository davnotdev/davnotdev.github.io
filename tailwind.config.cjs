/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {},
    colors: {
        "white": "#ffffff",

        "night-0": "#111419",
        "night-1": "#1e1d2b",
        "night-2": "#29273d",
        "night-3": "#323049",
        "night-text": "#cee9ef",
        "night-text-link": "#8c99d1",

        "gold": "#ffd700",
        "silver": "#c0c0c0",
        "bronze": "#cd7f32",
    },
  },
  plugins: [],
};

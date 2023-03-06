/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{js,ts,jsx,tsx}"],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                dark: {
                    100: "#161b22",
                    400: "#0d1117",
                    900: "#010409",
                },
            },
        },
    },
    plugins: [],
};

/**
 * Defines customizations that can either change existing tailwind properties
 * or add new ones.
 */
module.exports = {
    /** 
     * Any files in the project that reference the styles by name. These files
     * are checked for class names that should be kept when purging unused CSS.
     * https://tailwindcss.com/docs/optimizing-for-production#basic-usage
     */
    purge: ["./src/**/*.{js,jsx,ts,tsx}"],
    /**
     * We set the dark mode to class so that we can toggle dark mode manually
     * if the user desires.
     * https://tailwindcss.com/docs/dark-mode
     */
    darkMode: "class",
    /**
     * Lets us define the project's color palette, type scale, fonts,
     * breakpoints, and more.
     * https://tailwindcss.com/docs/theme
     */
    theme: {
        extend: {
            colors: {
                /** Set custom colors for dark mode. */
                dark: {
                    100: "#161b22",
                    400: "#0d1117",
                    900: "#010409",
                }
            },
            fontFamily: {
                /** 
                 * We want to add alconica since we'll be using it as the main 
                 * font of the site. 
                 */
                aclonica: ["aclonica", "sans-serif"],
            },
        },
    },
    /** 
     * Controls the variants that should be enabled for each core plugin. 
     * https://tailwindcss.com/docs/configuring-variants
     */
    variants: {
        extend: {},
    },
    /** 
     * Lets us register new styles for Tailwind to inject into the stylesheet with JavaScript.
     * https://tailwindcss.com/docs/plugins
     */
    plugins: [],
};

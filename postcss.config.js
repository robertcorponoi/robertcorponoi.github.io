module.exports = {
    /** 
     * The plugins to use with PostCSS.
     * https://github.com/postcss/postcss/blob/main/docs/plugins.md
     */
    plugins: {
        /**
         * A utility-first CSS framework for rapid UI development. 
         * https://github.com/tailwindlabs/tailwindcss
         */
        tailwindcss: {},
        /**
         * Adds vendor prefixes for us, using data from Can I Use.
         * https://github.com/postcss/autoprefixer
         */
        autoprefixer: {},
    },
};
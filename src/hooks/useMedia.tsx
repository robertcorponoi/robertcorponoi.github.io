import { useState, useEffect } from "react";

/**
 * Takes one or more CSS media queries, the values that relate to those
 * queries, and the default value and returns the value that should be used.
 * 
 * @param {string[]} queries The CSS media queries to check.
 * @param {(string|number|boolean)[]}values The values that correspond to the media queries.
 * @param {string|number|boolean} defaultValue The default value to use if none of the queries are applicable.
 */
const useMedia = (queries: string[], values: (string | number | boolean)[], defaultValue: string | number | boolean) => {

    /** Array of results for each media query. */
    const mediaQueryLists = queries.map((q) => typeof window !== "undefined" ? window.matchMedia(q) : undefined);

    /**
     * Gets the value to use based on each media query.
     * 
     * @returns {string|number|boolean}
     */
    const getValue = (): string | number | boolean | undefined => {
        if (!mediaQueryLists) return;

        const index = mediaQueryLists.findIndex(mql => mql ? mql.matches : undefined);
        return typeof values[index] !== "undefined" ? values[index] : defaultValue;
    };

    /** The local state for the matched values. */
    const [value, setValue] = useState(getValue);

    useEffect(() => {
        /**
         * Event listener callback.
         * 
         * Note: By defining getValue outside of useEffect we ensure that 
         * it has current values of hook args (as this hook callback is 
         * created once on mount).
         */
        const handler = () => setValue(getValue);

        // Set a listener for each media query with above handler as callback.
        mediaQueryLists.forEach((mql) => mql.addListener(handler));

        // Remove listeners on cleanup.
        return () => mediaQueryLists.forEach((mql) => mql.removeListener(handler));
    }, []);

    /** Return the value that should be used based on the queries. */
    return value;
};

export default useMedia;

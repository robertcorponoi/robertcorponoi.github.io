import { useEffect } from "react";

import useMedia from "./useMedia";
import useLocalStorage from "./useLocalStorage";

/**
 * Handles the state and local storage logic of keep track of whether the user
 * has dark mode enabled or not.
 * 
 * By default we will check `prefers-color-scheme` and then override it with
 * the toggle if used.
 */
const useDarkMode = () => {
    /** Use local storage to persist the option through refreshes. */
    const [enabledState, setEnabledState] = useLocalStorage("dark-mode-enabled", undefined);

    /** Check whether the user prefers dark mode by default. */
    const prefersDarkMode = useMedia(["(prefers-color-scheme: dark)"], [true], false);

    /** If the user has chosen an optional manually, use that. Otherwise use the OS level setting. */
    const enabled = typeof enabledState !== "undefined" ? enabledState : prefersDarkMode;

    /** Adds or removes the class that toggles dark mode. */
    useEffect(() => {
        const className = "dark";
        const element = window.document.body;

        enabled ? element.classList.add(className) : element.classList.remove(className);
    }, [enabled]);

    /** Return whether dark mode is enabled or not and the setter to change it. */
    return [enabled, setEnabledState];
};

export default useDarkMode;

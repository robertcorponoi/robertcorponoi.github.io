import React, { useState } from "react";
import { Switch } from "@headlessui/react";
import { SunIcon, MoonIcon } from "@heroicons/react/outline";

import useDarkMode from "../../hooks/useDarkMode";

/** Provides the user with an option to toggle the theme manually. */
const ThemeToggle = () => {
    /** The hook that manages the dark mode state. */
    const [darkModeEnabled, setDarkModeEnabled] = useDarkMode();

    return (
        <Switch
            checked={darkModeEnabled}
            onChange={setDarkModeEnabled}
            className={`
                ${darkModeEnabled ? "bg-gray-600" : "bg-gray-300"}
                "relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none"
            `}
        >
            <span className="sr-only">Toggle theme</span>
            <span
                className={`
                    ${darkModeEnabled ? "translate-x-5 bg-gray-50" : "translate-x-0 bg-white"}
                    "pointer-events-none relative inline-block h-5 w-5 rounded-full shadow transform ring-0 transition ease-in-out duration-200"
                `}
            >
                <span className="absolute inset-0 h-full w-full flex items-center justify-center transition-opacity p-0.5" aria-hidden="true">
                    {
                        darkModeEnabled
                            ? <MoonIcon className="w-5 h-5" />
                            : <SunIcon className="w-5 h-5" />
                    }
                </span>
            </span>
        </Switch>
    );
};

export default ThemeToggle;


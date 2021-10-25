import { useState } from "react";

/**
 * Handles the saving of data to the local storage with a syntax like
 * React's `setState` hook.
 * 
 * @param {string} key The name of the key to save the value under in local storage.
 * @param {string|number|boolean} initialValue The initial value of the item if it doesn't yet exist in local storage.
 */
const useLocalStorage = (key: string, initialValue: string | number | boolean) => {
    /** Get the initial value either from local storage if it exists or the `initialValue`. */
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    /**
     * Return a wrapped version of the `useState` setter function that persists 
     * the new value to local storage.
     */
    const setValue = (value: string | Function) => {
        try {
            // Allow value to be a function so we have same API as `useState`.
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);

            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(error);
        }
    };

    /** Return the value and its setter. */
    return [storedValue, setValue];
};

export default useLocalStorage;

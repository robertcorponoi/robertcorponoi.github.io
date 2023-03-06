---
title: Creating a Click Away Listener In React
date: "2021-11-02"
description: Often times for some components, you'll want to know when the user clicks away from the component. For this, a click away listener component can be handy.
---

Often times for some components, you'll want to know when the user clicks away from the component. A couple examples of when this might be useful include:

-   A modal. When the user clicks away from the modal, you probably want it to close.

-   A component where you want to track focus. You could use the mouse over and mouse out events but you might want to track when the user clicks in or clicks out of the area.

The way we do it is pretty simple, you just set a `useEffect` that, on mount, will add a click listener to the `window` that will check to see if the user clicked in the component or anywhere within the component.

```tsx
import React, { useRef, useState, useEffect } from "react";

/**
 * A component, that when the user clicks away from it, will not be
 * rendered.
 */
const Modal = () => {
    /** A ref to the root element of our component. */
    const rootRef = useRef<HTMLDivElement | null>(null);

    /**
     * Indicates whether the modal is open or not.
     *
     * Normally a modal would start out closed until it has been opened but
     * for this tutorial, we'll just start it in this state.
     */
    const [open, setOpen] = useState<boolean>(true);

    useEffect(() => {
        /**
         * Called when the a click is detected on the window to check whether
         * the user has clicked on an element that is not related to the modal and
         * if so, we set `open` to be false.
         *
         * @param {MouseEvent} event The click event.
         */
        const handleClickAway = (event: MouseEvent) => {
            // TypeScript only, need to get the `target` as a Node type.
            const eventTarget = event.target as Node;

            // Check if the click is inside the popper by checking whether
            // the click target is the root element of our component or a child
            // element of it.
            const isClickInside = rootRef.current?.contains(eventTarget);

            // If the click is not inside the component, we can set `open` to
            // false.
            if (!isClickInside) setOpen(false);
        };
        window.addEventListener("click", handleClickAway);

        // Remember to remove the event listener on clean up.
        return () => {
            window.removeEventListener("click", handleClickAway);
        };
    }, [rootRef]);

    return (
        open && (
            <div ref={rootRef}>
                <h1>Hello, world!</h1>
            </div>
        )
    );
};
```

You could even abstract this away into its own component so that you more
easily re-use the logic between components. To demonstrate this, we'll
abstract the logic away into a `ClickAwayListener` component and show how to
achieve the same result as above.

```tsx
import React, { useRef, useState, useEffect } from "react";

interface ClickAwayListenerProps {
    /** The function to run when the user has clicked away from the component. */
    onClickAway: () => void;
    /** The child element to check for clicks away. */
    children: React.ReactElement;
}

/**
 * A component, that wraps another component to check for clicks outside of
 * it. If it detects a click outside, it will run the provided `onClose`
 * function.
 *
 * @param {ClickAwayListenerProps} props
 */
const ClickAwayListener = ({
    onClickAway,
    children,
}: ClickAwayListenerProps) => {
    /** A ref to the root element of our component. */
    const rootRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        /**
         * Called when the a click is detected on the window to check whether
         * the user has clicked on an element that is not related to the modal and
         * if so, we set run the `onClickAway` function.
         *
         * @param {MouseEvent} event The click event.
         */
        const handleClickAway = (event: MouseEvent) => {
            // TypeScript only, need to get the `target` as a Node type.
            const eventTarget = event.target as Node;

            // Check if the click is inside the popper by checking whether
            // the click target is the root element of our component or a child
            // element of it.
            const isClickInside = rootRef.current?.contains(eventTarget);

            // If the click is not inside the component, run the function
            // provided in the props.
            if (!isClickInside) onClickAway();
        };
        window.addEventListener("click", handleClickAway);

        // Remember to remove the event listener on clean up.
        return () => {
            window.removeEventListener("click", handleClickAway);
        };
    }, [rootRef]);

    return <div ref={rootRef}>{children}</div>;
};

/**
 * A component, that when the user clicks away from it, will not be
 * rendered.
 */
const Modal = () => {
    /**
     * Indicates whether the modal is open or not.
     *
     * Normally a modal would start out closed until it has been opened but
     * for this tutorial, we'll just start it in this state.
     */
    const [open, setOpen] = useState<boolean>(true);

    return (
        open && (
            <ClickAwayListener onClickAway={() => setOpen(false)}>
                <h1>Hello, world!</h1>
            </ClickAwayListener>
        )
    );
};
```

You see that once you create the `ClickAwayListener` component, it becomes
much more clean in the components that are using it.

You can also experiment with adding more listeners to either other wrapper
components or to the `ClickAwayListener`. For instance, while the name
doesn't really fit it, I've added an `onClick` listener to the same component
to manage focus states. When the user clicked inside of the component, the
focus could be set and when they clicked outside the focus could be unset.

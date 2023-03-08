---
title: Creating a Tooltip React Component With Floating-UI and Tailwind
date: "2022-01-28"
description: Create a tooltip React component using just @floating-ui/dom and styled with tailwind.
---

# Creating a Tooltip React Component With Floating-UI & Tailwind

I recently picked up an old side project and came across a spot where I was
using a tooltip. I needed to make some modifications so I looked at the source
package, [react-popper](https://github.com/floating-ui/react-popper), and
noticed that it was in maintenance mode. Of course I didn't want to use a
package that is not supported anymore so I looked into their new package,
[floating-ui](https://github.com/floating-ui/floating-ui).

I followed the
[tutorial for a React tooltip](https://floating-ui.com/docs/tooltip) and
honestly I got a bit confused. It felt very bloated and it was not easy to
make a simple `<Tooltip title="Hello, world!">` reusable component. The React
library also felt like it had too much extra stuff that I didn't need so I
looked into their simplest package that offers to compute the position of the
tooltip, `@floating-ui/dom`. This library has a `computePosition` function
that will calculate the `top` and `left` values that should be applied to the
tooltip. Using this, I started work on using this function, along with
Tailwind to create a simple re-usable tooltip component.

For this tutorial, I used

-   `"@floating-ui/dom": "^1.2.3",`
-   ` "tailwindcss": "^3.2.7",`

Also, in my tailwind config, I enabled `mode: "jit"` which we will use for the
tooltip arrow. If you don't want an arrow for your tooltip then you don't need
this.

## Define Our Props

To define the props for the tooltip, we need to determine what it should look
like. When it is used, I wanted it to look like:

```tsx
<Tooltip
    title="Hello, world!"
    // Optionally, define the placement of the tooltip, defaulting to "top".
    placement="top"
>
    <button>Hello</button>
</Tooltip>
```

This should cover most use cases for tooltips. To achieve this we need the
following props:

-   `title` - The text to display when the tooltip is shown.
-   `placement` - Indicates which direction the tooltip should go. Floating UI
    will flip the direction if the tooltip doesn't have enough room with this
    placement.
-   `children` - This is the element/component that when hovered, will display
    the tooltip.

Let's build this out in Typescript.

```tsx
import type { Placement } from "@floating-ui/dom";

type TooltipProps = {
    /** The text to display in the tooltip. */
    title: string;
    /**
     * The position of the tooltip.
     *
     * @default "top"
     */
    placement?: Placement;
    /**
     * The element to used as the tooltip trigger. This element will be used to
     * position the tooltip.
     *
     * This element needs to be able to hold a `ref`.
     */
    children: React.ReactElement;
};
```

Note that we used `Placement` from `@floating-ui/dom` so that we know that the
placement we pass in is compatible with the function used to compute the
placement of the tooltip.

## Managing The Ref

Let's start with the `children` prop. As stated in the comment in the props,
this needs to be able to take a ref because we need to pass that ref to the
`computePosition` function. So in order to keep it simple for the consuming
component of the tooltip, we are going to use `cloneElement` to create a copy
and manage the ref in the tooltip.

```tsx
export const Tooltip = ({
    title,
    placement = "top",
    children,
}: TooltipProps) => {
    /**
     * The ref to the element that, when hovered over, will display the
     * tooltip. This is used by the `computePosition` function to calculate
     * the (x, y) position of the tooltip.
     */
    const elementRef = useRef<HTMLDivElement | null>(null);

    return (
        {/** We use a fragment here since the tooltip element will be at the same level as the `children`. */}
        <>
             {React.cloneElement(children, {
                ref: buttonRef,
            })}
        </>
    );
};
```

Now we've got a ref to the content of the tooltip without the user having to
manage it themselves.

## Adding The onMouseEnter & onMouseLeave Event Listeners

Next, we need to keep track of whether the tooltip should show or not. This
will involve:

-   Creating a component state property to keep track of the show/hide state.
-   Creating event listeners for mousing over and mousing out on the cloned
    element and updating the state accordingly.

```tsx
/** Indicates whether the tooltip should show or not. */
const [show, setShow] = useState<boolean>(false);

/**
 * Called when the user mouses over the button to show the tooltip and
 * update its position.
 */
const onMouseEnter = () => {
    setShow(true);
};

/**
 * Called when the user mouses out of the button to hide the tooltip.
 */
const onMouseLeave = () => {
    setShow(false);
};

return (
    <>
        {React.cloneElement(children, {
            ref: buttonRef,
            onMouseEnter,
            onMouseLeave,
        })}
    </>
);
```

Let's go over what we did there.

1. We created component state to keep track of whether the tooltip should be
   showing or not.
2. We created two event handlers to pass to the element that controls the
   hide/show state of the tooltip.
3. We assigned those two event handlers to the `onMouseEnter` and
   `onMouseLeave` events of the element. Simply put, when the user hovers
   over the element, we show the tooltip, and when they hover away we hide the
   tooltip.

## Adding The Tooltip Element

Now that we've got the basic show/hide state, we can add the element used for
the actual tooltip. We need to:

-   Create a "ref" for it. The `computePosition` function also needs a ref to
    the element used for the tooltip. I put "ref" in quotes because it won't be a
    normal ref but it'll be with `useState`. This is so that when `show` is
    `true`, the ref will be set and be available to the `computePosition`
    function. If we didn't do this, the ref would not update and not be available
    to be passed to the `computePosition` function.
-   Conditionally render the tooltip element.
-   Display the title in the tooltip.
-   Apply some basic styling to it using Tailwind.

```tsx
/** A "ref" to the tooltip element. */
const [tooltipRef, setTooltipRef] = useState<HTMLDivElement | null>(null);

return (
    <>
        {

            show && (
                <div
                    ref={setTooltipRef}
                        className="pointer-events-none absolute w-max top-0 left-0 bg-gray-700 text-gray-50 rounded py-1 px-2"
                >
                    {title}
                </div>
            )
        }
    <>
);
```

As we mentioned, we created the component state for the tooltip ref and then
in the return, we set the ref, added some styling, and added the title.

Let's go over the styles and what they do:

-   `absolute` - The tooltip needs to be absolutely positioned so that we can
    set its actual position after we calculate it.
-   `top-0 left-0` Set the initial position at the top left of the page.
-   `pointer-events-none` - This is needed so that the tooltip doesn't take
    focus away from the element with the `onMouseEnter` and `onMouseLeave` events.
    If we don't have this, you can end up with situations where the tooltip
    disappears even though you haven't hovered away from the element.
-   `w-max` - Makes sure that the tooltip is only ever as wide as its content.
-   `bg-gray-700 text-gray-50 rounded py-1 px-2` - Just to style the tooltip so
    that it looks like what you would expect a tooltip to look like. This can be
    customized however you want.

At this point if you run what we have so far, you can hover over the button
and the tooltip should show at the top left of the screen. Next we'll get to
positioning the tooltip.

## Positioning The Tooltip

Now that we have the tooltip rendering and showing when the button is hovered
over, we can put everything together and position the tooltip.

Let's make a function, called `updatePosition`, that will calculate the (x, y)
position of the tooltip. In this function, we'll pass in our `elementRef`,
`tooltipRef`, and the `placement` to `computePosition` and get the position
which we'll store in component state.

First, create the component state to hold the position of the tooltip. By
default it will be `null`, which we'll use later to apply some conditional
styling.

```tsx
/** The (x, y) position of the tooltip, if it has been calculated. */
const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
```

Now to the actual `updatePosition` function.

```tsx
import { computePosition, flip, shift } from "@floating-ui/dom";

/**
 * Calculates the (x, y) position of the tooltip at the provided
 * placement and sets it to the component state.
 */
const updatePosition = useCallback(() => {
    // Return early if we don't have everything we need to calculate the
    // position of the tooltip.
    if (!buttonRef.current || !tooltipRef) return;

    computePosition(buttonRef.current, tooltipRef, {
        placement,
        // This middleware will flip the the tooltip to the opposite
        // placement if there is not enough room and shift it to the
        // side if it is up against the edge of the screen.
        middleware: [flip(), shift()],
    }).then(({ x, y }) => {
        if (!tooltipRef) return null;

        setPosition({ x, y });
    });
}, [tooltipRef, placement]);
```

Let's go over the function in more details.

1. We return early if we don't have our refs. As discussed earlier these are
   needed to calculate the position so we cannot continue without them. This
   should not happen but we should check for it anyways.
2. Next, we pass in our refs and the `placement` to the `computePosition`
   function from `@floating-ui/dom`.
3. We also define a couple of `middleware` options. The middleware is best
   explained in their
   [documentation](https://floating-ui.com/docs/computePosition#middleware)
   but we'll quickly go over the ones we used. Here we use `flip`, which will
   flip the tooltip to the other direction if there is not enough room in the
   original direction. For example, if you specified a placement of "top" but
   "top" would be the top edge of the screen, then the tooltip wouldn't be
   visible. The `flip` modifier knows that and will flip the tooltip to be at
   the bottom instead. Same goes for `shift`, if the tooltip is too close to
   the left or right side of the screen, it will slide the tooltip over to the
   side so that it is fully visible.
4. At the end we get our (x, y) placement which we pass to our `position`
   component state which will cause a re-render and display the tooltip.

Before we apply the position to the tooltip though, we need to actually call
the `updatePosition` function when the tooltip should be shown. We'll do this
though a `useEffect`.

```tsx
/**
 * Whenever the tooltip should show, calculate the position that it should
 * be at.
 */
useEffect(() => {
    if (!show) return;

    updatePosition();
}, [show, updatePosition]);
```

Now we can apply our position to the tooltip element in the element's `styles`
so that it overwrites any other `top` and `left` styles.

```tsx
 <div
    ref={setTooltipRef}
    style={{
        top: position?.y,
        left: position?.x,
    }}
    className="pointer-events-none absolute w-max top-0 left-0 bg-gray-700 text-gray-50 rounded py-1 px-2"
>
```

If you run this, you should now see the tooltip placed above the button when
you hover over it. However, you might also notice that the tooltip is visible
at the top left of the screen before it is moved above the button. This is
beacuse the tooltip is shown before the position is calculated. However this
is necessary because the tooltip doesn't have a ref until it is shown and its
position cannot be calculated without it.

To solve this, we are going to add some conditional styles, using
[clsx](https://github.com/lukeed/clsx) to the tooltip element so that we don't
see it until it has a position.

```tsx
className={clsx(
    "pointer-events-none absolute w-max top-0 left-0 bg-gray-700 text-gray-50 rounded py-1 px-2",
    {
        "opacity-0": !position,
        "opacity-100": !!position,
    },
)}
```

By setting the opacity to 0 when the `position` hasn't been calculated yet, we
can ensure that we won't see the tooltip in the incorrect position while its
position is being calculated.

Also, we have to set our `position` back to `null` in the `onMouseLeave`
handler so that this style can work again next time.

```tsx
/**
 * Called when the user mouses out of the button to hide the tooltip.
 */
const onMouseLeave = () => {
    setShow(false);
    setPosition(null);
};
```

The tooltip should now work as expected. At this point you can feel free to
style the tooltip as you see fit. The section below will go over adding an
arrow to the tooltip, which is a personal preference of mine.

## (Optional) Adding An Arrow

The arrow is more complicated than expected but we'll start off simple, we
first need to create the "ref" and assign it to a `div` that's a descendant of
the tooltip element.

```tsx
const [arrowRef, setArrowRef] = useState<HTMLDivElement | null>(null);
```

```tsx
<div ref={setTooltipArrowRef} />
```

Next, we need to set up the component state that keeps track of its position
and add the `arrow` middleware to the `computePosition` function.

```tsx
const [arrowPosition, setArrowPosition] = useState<{
    x: number;
    y: number;
} | null>(null);
```

The arrow position is similar to the tooltip position, so nothing really new
there.

In the `computePosition` function, we use the `arrow` modifier, passing in the
ref to the tooltip arrow.

We also need to know the final placement of the tooltip. This is different
than the `placement` we pass in because the tooltip can be flipped if there's
not enough room in the direction provided in the `placement`. We save this
`placement` as a data attribute to the tooltip so that we can style the arrow
accordingly.

Finally, we set the position of the arrow returned by `computePosition` to the
component state created above.

```tsx
computePosition(buttonRef.current, tooltipRef, {
    placement,
    middleware: [
        shift(),
        // We also add an offset because the arrow will be very close to the
        // button.
        // Imported as { offset } from "@floating-ui/dom".
        offset(10),
        // Use the arrow modifier passing in the ref to our arrow.
        // Imported as { arrow } from "@floating-ui/dom".
        arrow({ element: tooltipArrowRef }),
    ],
}).then(({ x, y, placement, middlewareData }) => {
    if (!tooltipRef) return null;

    setPosition({ x, y });

    // Set the final placement of the tooltip as a data attribute so
    // it can be used to style the tooltip arrow.
    tooltipRef.dataset.placement = placement;

    if (middlewareData.arrow) {
        const { x: arrowX, y: arrowY } = middlewareData.arrow;

        // We will only get the `x` or `y` position of the arrow back. If the
        // placement is top or bottom, we get the `x`, otherwise we get the
        // `y`.
        setArrowPosition({
            x: arrowX ? arrowX : "",
            y: arrowY ? arrowY : "",
        });
    }
});
```

Also, when in the `onMouseLeave` event handler, we want to reset the position
of the arrow.

```tsx
const onMouseLeave = () => {
    setShow(false);
    setPosition(null);
    setArrowPosition(null);
};
```

Now that we have the position of the arrow, we need to apply the styles to get
it to actually show and be styled like an arrow.

This is where `mode: "jit"` in the `tailwind.config.js` will come in handy.
What it does is allow us to style based on the `data-attribute`, which is
where we store the value of the final placement of the tooltip.

First, we need to add the `group` class name to the tooltip element. We'll
then be able to style the tooltip arrow based on that since it is a
descendent of the tooltip.

```tsx
className={clsx(
    "group pointer-events-none absolute w-max top-0 left-0 bg-gray-700 text-gray-50 rounded py-1 px-2",
    {
        "opacity-0": !position,
        "opacity-100": !!position,
    },
)}
```

Now to style the arrow.

All tooltip styles need to be absolutely positioned and will need to be
transformed, so we need to start with:

```tsx
className = "absolute transform";
```

If the tooltip placement is top, then `arrowPosition` will have a `x` value,
but no value. This means that the arrow will default at the top but we need to
move it to the bottom of the tooltip so that it points down.

```tsx
className = "absolute transform
    group-data-[placement=top]:top-full
    group-data-[placement=top]:-translate-x-1/2"
```

This will place the arrow at the bottom and offset the x position by half of
the width so that it remains in the center of the position specified by the
`arrowPosition`.

Next, we just add the style to make it a triangle, this is nothing special but
it's lengthy because we have to style it based on the data property of the
tooltip.

```tsx
className = "absolute transform border-solid
    group-data-[placement=top]:top-full
    group-data-[placement=top]:-translate-x-1/2
    group-data-[placement=top]:border-t-gray-700
    group-data-[placement=top]:border-t-8
    group-data-[placement=top]:border-x-transparent
    group-data-[placement=top]:border-x-8
    group-data-[placement=top]:border-b-0"
```

The styles for the bottom placement are similar with some values reversed. The
difference with the positioning is that we start the arrow at the top and
offset the height by 100% so that the arrow is pointing up.

```tsx
className = "absolute transform border-solid
    group-data-[placement=bottom]:top-0
    group-data-[placement=bottom]:-translate-y-full
    group-data-[placement=bottom]:-translate-x-1/2
    group-data-[placement=bottom]:border-b-gray-700
    group-data-[placement=bottom]:border-b-8
    group-data-[placement=bottom]:border-x-transparent
    group-data-[placement=bottom]:border-x-8
    group-data-[placement=bottom]:border-t-0"
```

Right and left placements follow similar patterns, so I'll just add them below.

Right:

```tsx
className = "absolute transform border-solid
    group-data-[placement=right]:left-0
    group-data-[placement=right]:-translate-x-full
    group-data-[placement=right]:-translate-y-1/2
    group-data-[placement=right]:border-r-gray-700
    group-data-[placement=right]:border-r-8
    group-data-[placement=right]:border-y-transparent
    group-data-[placement=right]:border-y-8
    group-data-[placement=right]:border-l-0"
```

Left:

```tsx
className = "absolute transform border-solid
    group-data-[placement=left]:left-full
    group-data-[placement=left]:-translate-y-1/2
    group-data-[placement=left]:border-l-gray-700
    group-data-[placement=left]:border-l-8
    group-data-[placement=left]:border-y-transparent
    group-data-[placement=left]:border-y-8
    group-data-[placement=left]:border-r-0"
```

That's it. If you go back to your button and hover over it, you should see a
tooltip with an arrow pointing towards the button. There's a lot of class
names on the arrow but once you can follow the pattern it should be pretty
simple to follow.

## Conclusion

This was an example how to create a tooltip using just the positioning utility
provided by `@floating-ui/dom`. You should check out what else the library
offers because if you end up using any other utilities, it might be worth
using their more packages with more overhead which might include easier ways
to create tooltips.

## Final Code

```tsx
import clsx from "clsx";
import { offset, Placement } from "@floating-ui/dom";
import { arrow, computePosition, shift } from "@floating-ui/dom";
import React, { useCallback, useEffect, useRef, useState } from "react";

type TooltipProps = {
    /** The text to display in the tooltip. */
    title: string;
    /**
     * The position of the tooltip.
     *
     * @default "top"
     */
    placement?: Placement;
    /**
     * The element to used as the tooltip trigger. This element will be used to
     * position the tooltip.
     *
     * This element needs to be able to hold a `ref`.
     */
    children: React.ReactElement;
};

/**
 * Displays info text when the user hovers over an element.
 *
 * @param {TooltipProps} props
 */
export const Tooltip = ({
    title,
    placement = "top",
    children,
}: TooltipProps) => {
    /** Indicates whether the tooltip should show or not. */
    const [show, setShow] = useState<boolean>(false);

    /** The computed x, y coordinates to use for the tooltip. */
    const [position, setPosition] = useState<{ x: number; y: number } | null>(
        null
    );

    /** The computed x, y coordinates to use for the tooltip arrow. */
    const [arrowPosition, setArrowPosition] = useState<{
        x: number | string;
        y: number | string;
    } | null>(null);

    /** A ref to the button used to trigger the tooltip. */
    const buttonRef = useRef<HTMLButtonElement | null>(null);

    /**
     * A ref to the tooltip contents. We use `useState` here instead of a
     * `useRef` because we need to be able to update the ref when the tooltip
     * is rendered.
     */
    const [tooltipRef, setTooltipRef] = useState<HTMLDivElement | null>(null);

    /** A ref to the tooltip arrow. We use `useState` here for the same reason. */
    const [tooltipArrowRef, setTooltipArrowRef] =
        useState<HTMLDivElement | null>(null);

    /**
     * Whenever the tooltip should show, update it's position so that it is
     * positioned correctly.
     */
    const updatePosition = useCallback(() => {
        // Return early if we don't have everything we need to calculate the
        // position of the tooltip and its arrow.
        if (!buttonRef.current || !tooltipRef || !tooltipArrowRef) return;

        computePosition(buttonRef.current, tooltipRef, {
            placement,
            middleware: [
                shift(),
                offset(10),
                arrow({ element: tooltipArrowRef }),
            ],
        }).then(({ x, y, placement, middlewareData }) => {
            if (!tooltipRef) return null;

            // The position for the tooltip can just be applied directly from
            // the position returned by `computePosition`.
            setPosition({ x, y });

            // Set the final placement of the tooltip as a data attribute so
            // it can be used to style the tooltip arrow.
            tooltipRef.dataset.placement = placement;

            if (middlewareData.arrow) {
                // For the arrow, depending on the final placement, we only
                // get back a x or y value.
                const { x: arrowX, y: arrowY } = middlewareData.arrow;

                setArrowPosition({
                    x: arrowX ? arrowX : "",
                    y: arrowY ? arrowY : "",
                });
            }
        });
    }, [tooltipRef, tooltipArrowRef, placement]);

    /**
     * Called when the user mouses over the button to show the tooltip and
     * update its position.
     */
    const onMouseEnter = () => {
        setShow(true);
        updatePosition();
    };

    /**
     * Called when the user mouses out of the button to hide the tooltip.
     */
    const onMouseLeave = () => {
        setShow(false);
        setPosition(null);
        setArrowPosition(null);
    };

    /**
     * Whenever the tooltip should show, calculate the position that it should
     * be at.
     */
    useEffect(() => {
        if (!show) return;

        updatePosition();
    }, [show, updatePosition]);

    return (
        <>
            {show && (
                <div
                    ref={setTooltipRef}
                    style={{
                        top: position?.y,
                        left: position?.x,
                    }}
                    className={clsx(
                        "group pointer-events-none absolute w-max top-0 left-0 bg-gray-700 text-gray-50 rounded py-1 px-2",
                        {
                            "opacity-0": !position,
                            "opacity-100": !!position,
                        }
                    )}
                >
                    <div
                        ref={setTooltipArrowRef}
                        style={{
                            top: arrowPosition?.y,
                            left: arrowPosition?.x,
                        }}
                        className="absolute transform border-solid 
                            group-data-[placement=top]:top-full 
                            group-data-[placement=top]:-translate-x-1/2 
                            group-data-[placement=top]:border-t-gray-700 
                            group-data-[placement=top]:border-t-8 
                            group-data-[placement=top]:border-x-transparent 
                            group-data-[placement=top]:border-x-8 
                            group-data-[placement=top]:border-b-0

                            group-data-[placement=bottom]:top-0 
                            group-data-[placement=bottom]:-translate-y-full
                            group-data-[placement=bottom]:-translate-x-1/2 
                            group-data-[placement=bottom]:border-b-gray-700 
                            group-data-[placement=bottom]:border-b-8 
                            group-data-[placement=bottom]:border-x-transparent
                            group-data-[placement=bottom]:border-x-8 
                            group-data-[placement=bottom]:border-t-0

                            group-data-[placement=right]:left-0 
                            group-data-[placement=right]:-translate-x-full 
                            group-data-[placement=right]:-translate-y-1/2 
                            group-data-[placement=right]:border-r-gray-700 
                            group-data-[placement=right]:border-r-8 
                            group-data-[placement=right]:border-y-transparent 
                            group-data-[placement=right]:border-y-8 
                            group-data-[placement=right]:border-l-0

                            group-data-[placement=left]:left-full 
                            group-data-[placement=left]:-translate-y-1/2 
                            group-data-[placement=left]:border-l-gray-700 
                            group-data-[placement=left]:border-l-8 
                            group-data-[placement=left]:border-y-transparent 
                            group-data-[placement=left]:border-y-8 
                            group-data-[placement=left]:border-r-0"
                    />
                    {title}
                </div>
            )}
            {React.cloneElement(children, {
                ref: buttonRef,
                onMouseEnter,
                onMouseLeave,
            })}
        </>
    );
};
```

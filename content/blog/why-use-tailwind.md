---
title: Why Use Tailwind?
slug: why-use-tailwind
date: "2021-10-28"
description: 
tags: ["blog", "react", "javascript", "tailwindcss"]
---

[TailwindCSS](https://tailwindcss.com/) has become one of my favorite 
frameworks to work with in the past couple of years. I've used it in every and 
all personal web apps and even recommended and implemented it at work wherever 
I can. This is quite the change for me too, as when I was first introduced to 
Tailwind I hated the idea of it. Now, I can't imagine starting a new application 
without using Tailwind.

## What is Tailwind?

Tailwind is, as they describe it, a utility-first CSS framework. Let's go over
an example.

Let's say that you have this structure:

```html
<div>
    <h1>Hello, world!</h1>
    <p>I am centered horizontally and vertically</p>
</div>
```

As the paragraph tag says, we want to center this. With traditional CSS we
would assign it a class name and then target that class name in a CSS file.
It would look something like:

```css
div {
    display: flex;
    align-items: center;
    justify-content: center;
}
```

With Tailwind, you never have to leave the HTML and can just use the class
names from Tailwind:

```html
<div className="flex items-center justify-center">
    <h1>Hello, world!</h1>
    <p>I am centered horizontally and vertically</p>
</div>
```

## What I Like

1. You don't have to leave the HTML.

This is one of the most important pros of Tailwind for me. There's no need to
leave the markup because I can apply every style I need within there. This
leads to faster development time and less context switching as everything is
in one spot. A counter-argument to this is that you can use styles inline but 
this leads into point 2.

2. You can easily apply responsive styling. Responsive queries in CSS add more 
complexity than necessary to a CSS file. An example of changing a container's
width for different screen sizes in Tailwind can look like:

```html
<div className="w-full md:w-8-12 lg:w-6/12 xl:w-4/12"></div>
```

3. Similar to the point above is pseudo styles. Hover, active, focus, and 
other similar styles can be applied just as easily. An example of gray text 
that turns blue on hover can look like:

```html
<p className="text-gray-800 hover:text-blue-800">Hello, world!</p>
```

There's also the same utilities but for groups so for example if you have a 
div with multiple elements but you want every element to turn blue when the 
div is hovered over, you could do:

```html
<div className="group">
    <p className="text-gray-800 group-hover:text-blue-800">Hello</p>
    <p className="text-gray-800 group-hover:text-blue-800">world</p>
</div>
```

This also goes for dark mode. Tailwind can be configured to either detect the 
user's dark mode preference or you can make it so that the `dark` class name 
has to be present for dark mode to be used. To style for dark mode, you just 
prefix any class name with `dark` like so:

```html
<p className="text-gray-800 dark:text-gray-50">I'm dark on light mode and light on dark mode!</p>
```

4. It's highly customizable. You might be thinking that Tailwind sounds great 
but you don't want to be limited by the colors, spacing, or other utilities. 
The great new is that you don't have to be. Tailwind takes a configuration file 
that lets you modify existing properties and also add new ones.

If you don't like the color of `text-indigo-500`, you can change it. Have your 
own branding? Create a set of new colors that work for you. Almost everything 
about the framework can be changed and you can add in any other styles that are 
missing. Extending the configuration works really well with tools like Figma 
where designers can set up complex palettes that can be implemented in the 
Tailwind config.

There's also a wide array of [plugins](https://github.com/aniftyco/awesome-tailwindcss)
that can be used to add more styles and functionality to your Tailwind 
instance. Who knows, maybe you could have an idea for the next great Tailwind 
plugin.

5. No bloat in production. The Tailwind configuration can be set to purge 
unused classes in any files or globs that you provide when run in production. 
This means that even if you don't ever use 90% of Tailwind's (or your own from 
a custom configuration), they won't ever slow down your site because they won't 
exist in the production build of your app.

## Final Thoughts

While there's many more reasons I could go over, I highly encourage you to 
check out their [documentation](https://tailwindcss.com/) and see it for 
yourself. Be prepared that you might need to consult the documentation for 
bit as you familiarize yourself with the syntax but I guarantee that the more 
you use it, the more you'll like it.
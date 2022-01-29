---
title: Creating a React App Without react-scripts
slug: creating-a-react-app-without-react-scripts
date: "2022-01-28"
description: While you can quickly get started with Create React App or react-scripts, it can be helpful to have more control and understanding of your React app.
tags: ["react"]
---

Most recommendations to starting a React app involve using [Create React App](https://create-react-app.dev/) or adding  [react-scripts](https://github.com/facebook/create-react-app/tree/main/packages/react-scripts) as a dependency. These are very helpful for quickly setting up a React app but they don't help you fully understand the build process and how it all works together. This tutorial will go over setting up the entire build process of a React app without using `react-scripts` as an abstraction.

The final template is available on [GitHub](https://github.com/robertcorponoi/react-template).

We will also include some other, non-essential, tools for a better development experience.

- [TypeScript](https://www.typescriptlang.org/) for type checking and countless helpful features.
- [Redux](https://redux.js.org/) for state management. You can choose to not add this when we get to that part but consider the possible scale of your app and whether you might need state management or not.
- [TailwindCSS](https://tailwindcss.com/) for a simple utility-first CSS framework to write styling without leaving your HTML.
- [PostCSS](https://postcss.org/) to help with TailwindCSS and other CSS modules/frameworks.
- [Prettier](https://prettier.io/) to maintain code style throughout the application.
- [ESLint](https://eslint.org/) to check for errors throughout the application.

**Table of Contents**

- [Creating the Application](#creating-the-application)
- [Setting Up Core Dependencies](#setting-up-core-dependencies)
    - [React & React DOM](#react-&-react-dom)
    - [Redux](#redux)
    - [TypeScript](#typescript)
    - [Webpack & Babel](#webpack-&-babel)
- [Setting Up Optional Dependencies](#setting-up-optional-dependencies)
    - [ESLint](#eslint)
    - [Prettier](#prettier)
    - [PostCSS & TailwindCSS](#postcss-&-tailwindcss)
- [Add Build Scripts](#add-build-scripts)
- [Create the index.html File](#create-the-index.html-file)
- [Render the React App](#render-the-react-app)
- [Creating the App Component](#creating-the-app-component)
- [Adding the Redux Store](#adding-the-redux-store)
- [Conclusion](#conclusion)

## Creating the Application

To start, navigate to the directory you want your React app to be in and initialize a new npm package like so:

```sh
npm init .
```

## Setting Up Core Dependencies

### React & React DOM

Since we're making a React app, `react` and `react-dom` are core dependencies that need to be installed:

```sh
npm install react react-dom
```

We also want their types saved as dev dependencies:

```sh
npm install @types/react @types/react-dom --save-dev
```

### Redux

Redux is used to manage the application state. While initially complicated, it's a very powerful library and you should invest time into learning how to use it. The sample application we build will have a basic example and can be used as a good starting point.

To install Redux and Redux helpers, add the following dependencies.

```sh
npm install react-redux redux-thunk
```

### TypeScript

To add [TypeScript](https://www.typescriptlang.org/) to our React app we need to install it and create the `tsconfig.json` file which will define how we plan to use TypeScript.

1. Install TypeScript as a dev dependency to the React app:

```sh
npm install typescript --save-dev
```

2. Create a `tsconfig.json` file at the root directory of the React app and paste the content below. I've commented each option to give you an idea of what it does but you can also check the [tsconfig documentation](https://www.typescriptlang.org/tsconfig) for more in-depth information.

```json
{
    "compilerOptions": {
        // Indicates which JS features are downleveled and which are left intact.
        "target": "es6",
        // Defines which type definitions for built in JS APIs are available.
        "lib": ["dom", "dom.iterable", "esnext"],
        // Allows JavaScript files to be imported in the project instead of just `.ts` and `.tsx`.
        "allowJs": true,
        // Skips type checking of declaration files. This can save time during compilation at the expensive of type-system accuracy.
        "skipLibCheck": true,
        // Don't treat CommonJS/AMD/UMD modules like ES6 modules.
        "esModuleInterop": true,
        // Allows us to write an import like `import React from "react";` instead of `import * as React from "react";`.
        "allowSyntheticDefaultImports": true,
        // Enables a wide range of type checking behavior that results in stronger guarantees of program correctness.
        "strict": true,
        // Show errors if a program tries to include a file by a casing different from the casing on disk.
        "forceConsistentCasingInFileNames": true,
        // Ensures that non-empty case inside a switch statement includes either `break` or `return`.
        "noFallthroughCasesInSwitch": true,
        // Sets the module system of the program. See https://www.typescriptlang.org/docs/handbook/modules.html for more information.
        "module": "esnext",
        // Specifies the module resolution strategy. This will almost always be "node".
        "moduleResolution": "node",
        // Allows importing modules with a `.json` extension.
        "resolveJsonModule": true,
        // Warns us if we write code that can't be correctly interpreted by a single-file transpilation process.
        "isolatedModules": true,
        // Does not emit compiler output files like JavaScript source code, source-maps, or declarations.
        // This makes room for another tool like Babel to handle converting the TypeScript file to a file which can run inside a JavaScript environment.
        "noEmit": false,
        // Controls how JSX constructs are emitted in JavaScript files.
        // Using `react-jsx` emits `.js` files with the JSX changed to `_jsx` calls.
        "jsx": "react-jsx"
    },
    // Specifies an array of filenames or patterns to include in the program.
    "include": ["src"]
}
```

### Webpack & Babel

[Webpack](https://webpack.js.org/) is one of the most important dependencies. It's going to bundle our JSX, TypeScript, and styling for the dev and prod builds. It also gives us dev server that will reload automatically when changes are made to the React app to make development faster. Webpack is going to use [Babel](https://babeljs.io/) to compile our JSX and TypeScript.

1. First, we need to install all of the Webpack and Babel packages that we'll need. We'll define what these are for in their configuration files:

Core Webpack dependencies:

```sh
npm install webpack webpack-cli webpack-bundle-analyzer webpack-dev-server --save-dev
```

Webpack loaders used to transform our JSX, TypeScript, and styles:

```sh
npm install ts-loader style-loader postcss-loader css-loader babel-loader --save-dev
```

Webpack plugins for fast-reload to make our dev environment easier to use:

```sh
npm install react-refresh react-refresh-typescript @pmmmwh/react-refresh-webpack-plugin --save-dev
```

Core Babel dependencies:

```sh
npm install @babel/cli @babel/core @babel/preset-env @babel/preset-react @babel/preset-typescript --save-dev
```

2. Next we'll create the `webpack.config.js` file that'll define what we need transformed and what loader we are going to use to transform it. We'll also define our dev server settings that'll let us have fast-reload while developing.

The Webpack config can be complicated so make sure to take the time to look at the comments for each option to understand how it all works together. If you need extra help, check out the [Webpack configuration documentation](https://webpack.js.org/configuration/).

```js
const path = require("path");
const webpack = require("webpack");
const BundleAnalyzerPlugin =
    require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const ReactRefreshTypeScript = require("react-refresh-typescript");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");

/**
 * Returns the configuration that Webpack should use.
 *
 * @param {object} env
 * @param {boolean} env.production Indicates whether this is a production build or not.
 * @param {boolean} env.analyze Indicates whether the bundle analyzer should be run for this build or not.
 */
module.exports = (env) => {
    // For the fast refresh plugin we need to know if we're creating a development build or not.
    const isDevelopment = env.production ? false : true;

    // Set the node env so that tailwind purges unused styles correctly on production.
    process.env.NODE_ENV = env.production ? "production" : "development";

    return {
        // Where the application starts and where Webpack should begin bundling files.
        entry: "./src/index.tsx",
        // Indicates the environment we are in. This is used by Webpack to determine what built-in optimizations are used.
        mode: env.production ? "production" : "development",
        // The module object defines how our exported JavaScript modules are transformed according to the rules.
        module: {
            rules: [
                // Tell Webpack to transform our ES6 and JSX with babel/env.
                // In the exclude, we're letting Webpack know to ignore the node_modules directory.
                {
                    test: /\.(js|jsx)$/,
                    exclude: /(node_modules|bower_components)/,
                    loader: "babel-loader",
                    options: { presets: ["@babel/env"] },
                },
                // Transforms our CSS.
                {
                    test: /\.css$/i,
                    use: ["style-loader", "css-loader", "postcss-loader"],
                },
                // Tell webpack to transform our TSX with ts-loader.
                // Same as with the JSX, we let Webpack know to ignore the node_modules directory.
                {
                    test: /\.[jt]sx?$/,
                    exclude: /node_modules/,
                    use: [
                        {
                            loader: require.resolve("ts-loader"),
                            options: {
                                getCustomTransformers: () => ({
                                    before: isDevelopment
                                        ? [ReactRefreshTypeScript()]
                                        : [],
                                }),
                                // ts-loader does not work with hot module replacement unless the `transpileOnly` property is used.
                                // If you need type checking, `ForkTsCheckerWebpackPlugin` is an alternative.
                                transpileOnly: isDevelopment,
                            },
                        },
                    ],
                },
            ],
        },
        // Specifies the extensions that Webpack should resolve.
        // This allows us to import modules without needing to add their extensions.
        resolve: { extensions: ["*", ".js", ".jsx", ".ts", ".tsx"] },
        // Tells Webpack where to put the bundled code.
        // Here we tell Webpack to place it in the dist directory at the root of the project.
        output: {
            path: path.resolve(__dirname, "dist/"),
            publicPath: "/dist/",
            filename: "bundle.js",
        },
        // The options for the Webpack dev server.
        // This tells Webpack to serve everything from our public directory to localhost:3000.
        devServer: {
            port: 3000,
            hot: true,
        },
        plugins: [
            // The plugins needed to perform "Fast Refresh" which allows us to update components and see the results without refreshing.
            // https://github.com/pmmmwh/react-refresh-webpack-plugin
            isDevelopment && new webpack.HotModuleReplacementPlugin(),
            isDevelopment && new ReactRefreshWebpackPlugin(),
            // The plugin needed to run the Webpack build analyzer to analyze bundle sizes.
            env.analyze && new BundleAnalyzerPlugin(),
        ].filter(Boolean),
    };
};
```

3. We also need a `.babelrc` configuration file to add our React and TypeScript presets. There's not too much to comment here but if you need more information about the Babel configuration, check out their [documentation](https://babeljs.io/docs/en/configuration).

```json
{
    "presets": [
        // Adds support for ES6+
        // https://babeljs.io/docs/en/babel-preset-env
        "@babel/env",
        // Adds support for JSX
        // https://babeljs.io/docs/en/babel-preset-react
        "@babel/preset-react",
        // Adds support for TS and TSX
        // https://babeljs.io/docs/en/babel-preset-typescript
        "@babel/preset-typescript"
    ]
}
```

With Webpack and Babel set up, we're done with the core parts of the setup. Next I'll go over the dependencies that I strongly recommend but are not necessary for the React app.

## Setting Up Optional Dependencies

These dependencies will help us have a better development experience (ESLint, Prettier) and a CSS library (PosCSS, TailwindCSS).

### ESLint

[ESLint](https://eslint.org/) is a configurable static code analysis tool that can help us find problems with our React app before we even compile. To get a good setup of ESLint and the packages that can help us, install the following dev dependencies.

```sh
npm install eslint eslint-plugin-react @typescript-eslint/parser @typescript-eslint/eslint-plugin --dev-dev
```

This are the basic dependencies needed to lint our React TypeScript app. There's some more useful ones such as packages that help ESLint check for hooks errors, accessibility issues, etc. I recommend you check out the ESLint ecosystem to see what can help you.

To define the plugins and rules, we need to create a `.eslintrc.js` file. Below is an example of the minimal file with our installed dependencies:

```js
module.exports = {
    env: {
        browser: true,
        es2021: true,
    },
    extends: [
        "eslint:recommended",
        "plugin:react/recommended",
        "plugin:react/jsx-runtime",
        "plugin:@typescript-eslint/recommended",
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
        ecmaVersion: 12,
        sourceType: "module",
    },
    plugins: ["react", "@typescript-eslint"],
    rules: {},
};
```

You can check out more configuration options in the [ESLint configuration documentation](https://eslint.org/docs/user-guide/configuring/).

You can also create a `eslintignore` file which can be used like a `.gitignore` to define the files that ESLint should ignore. The `node_modules` directory is automatically ignored but you can add any other files you wish for ESLint to ignore in this file. 

## Prettier

[Prettier](https://prettier.io/) is a code formatter can help us maintain a consistent style throughout our application. To install Prettier, we need to install it as a dev dependency.

```sh
npm install prettier --save-dev
```

Just like ESLint, we need to create a configuration file. Create a new file named `.prettierrc.json` and put the following content in it.

```json
{
    "semi": true,
    "trailingComma": "all",
    "singleQuote": false,
    "tabWidth": 4
}
```

You should change this to suit your needs but these are pretty good initial settings. This basic setup enforces semicolons, trailing commands, double quotes, and a tab width of 4 spaces. You can find more settings in the [Prettier configuration documentation](https://prettier.io/docs/en/configuration.html).

## PostCSS & TailwindCSS

[TailwindCSS](https://tailwindcss.com/), which relies on [PostCSS](https://postcss.org/) is used to make styling easier. TailwindCSS is a utility-first framework that lets us style our components completely without leaving the HTML. If you want a more in-depth explanation of TailwindCSS, check out my article about [Why Us Tailwind?](https://robertcorponoi.com/why-use-tailwind/).

To install TailwindCSS, add the following dev dependencies.

```sh
npm install postcss tailwindcss autoprefixer
```

Note that we also install [autoprefixer](https://github.com/postcss/autoprefixer) which is a handy utility to add vendor prefixes so that we don't need to worry about that.

PostCSS needs its own configuration file that defines the plugins to use. We are using autoprefixer and TailwindCSS so we have to define them in the configuration file.

Create a `postcss.config.js` file and add the following contents.

```js
module.exports = {
    plugins: {
        // Uses Tailwind as a PostCSS plugin.
        // https://tailwindcss.com/docs/installation#installing-tailwind-css-as-a-post-css-plugin
        tailwindcss: {},
        // PostCSS plugin to parse CSS and add ventor prefixes to CSS rules using values from Can I Use.
        // https://github.com/postcss/autoprefixer
        autoprefixer: {},
    },
};
```

Lastly, TailwindCSS has its own configuration file. This file defines the files to purge and it allows you to extend the framework with custom styles. The purge option is used by TailwindCSS to check files for class names used. Any class names that it doesn't find used in any of the provided files, it removes from the final bundle to save on bundle size. This is important as you don't want to ship the entire TailwindCSS bundle with your application, just the styles you're using.

Create a `tailwind.config.js` file and add the following contents.

```js
module.exports = {
    // An array of paths to the template files that should be purged of unused styles.
    // https://tailwindcss.com/docs/optimizing-for-production
    purge: ["./src/**/*.js", "./src/**/*.ts", "./src/**/*.tsx"],
    // If set to media, dark mode classes, like `dark:text-white` will take precedence over unprefixed classes.
    // If set to class, dark mode classes will be applied whenever the `dark` class is present in the HTML tree.
    // https://tailwindcss.com/docs/dark-mode
    darkMode: "media",
    theme: {
        extend: {},
    },
    variants: {
        extend: {},
    },
    plugins: [],
};
```

More information about the TailwindCSS configuration file can be found in the [documentation](https://tailwindcss.com/docs/configuration).

## Add Build Scripts

In the `package.json` we need to add a few scripts so that we can develop, analyze, and build our application.

Add the following scripts to the `package.json` file under the `scripts` property.

```json
{
    "scripts": {
        "build:dev": "webpack --mode development",
        "build:prod": "webpack --mode production --env production",
        "analyze:dev": "webpack --env analyze",
        "analyze:prod": "webpack --env analyze --env production --mode production",
        "develop": "webpack serve --progress"
    }
}
```

The scripts can be used in the form of npm run [script_name]:

`develop` - This is the script to run when you are actively developing your React app. This will run the webpack dev server in development mode with fast refresh so you can save your changes and see them in real time without refreshing your app.

`build:dev` - Creates a development build of your React app output to the build folder at the root directory.

`build:prod` - Creates a production build of your React app output to the build folder at the root directory. This will minify bundles and purge unused classes from your code to create the smallest build possible.

`analyze:dev` - Runs the Webpack bundle analyzer and provides you with a link that you can use to see what packages your Webpack bundle consists of.

`analyze:prod` - Runs the Webpack bundle analyzer but in production mode which will minify scripts first and then provides you with a link that you can use to see what packages your Webpack bundle consists of.

## Create the index.html File

We need to create the starting point of our application, the `index.html` file. This file will have a basic structure and it will contain the root div that React will render the application to. We'll also set the point where the Webpack bundle is inserted.

Create a directory named `public` and inside of it create an `index.html` file. In this file, add the following content.

```html
<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <title>React Starter</title>
</head>

<body>
    <!-- The React app will hook into this div with the id of #root. -->
    <div id="root"></div>

    <noscript>
        You need to enable JavaScript to run this app.
    </noscript>

    <!-- The bundle generated by webpack. -->
    <script src="../dist/bundle.js"></script>
</body>

</html>
```

## Render the React App

Now that we have the `index.html` and the `root` div to render the React App to, we need to actually define that in the code. To start, create a `src` directory at the root level and create an `index.tsx` file within it.

This file is going to be pretty simple and we'll add to it as we expand our application. For now, we just need to tell `react-dom` where it should render our application.

```tsx
import React from "react";
import ReactDOM from "react-dom";

/**
 * Tells React what to render and where to render it.
 *
 * In our case, we're rending our root `App` component to the DOM element with
 * the id of `root` in the `public/index.html` file.
 */
ReactDOM.render(
    <></>,
    document.getElementById("root"),
);
```

## Creating the App Component

You'll see above that we're not rendering anything current. We need to create our first component, `App.tsx`. Here we'll just use a basic div and add more example content to it later. This is also a good place to import global CSS.

First, create the `App.tsx` component at the same level as the `index.tsx` file. Also, at the same level, create an `App.css` file. This file should rarely be used if you're using TailwindCSS but it's good to have if needed. In the `App.tsx` file, add the following contents.

```tsx
import React from "react";

import "./App.css";
import "tailwindcss/tailwind.css";

const App = () => {
    return (
        <div className="App">
            <h1>Hello from React!</h1>
        </div>
    );
};

export default App;
```

You'll notice here that we import our `App.css` and also `tailwindcss/tailwind.css` so that we can use TailwindCSS class names. Other than that, we just have a root div as is standard in most React applications.

Now, back in the, `index.tsx` file, we need to import the `App.tsx` file and render it.

```tsx
import React from "react";
import ReactDOM from "react-dom";

import App from "./App";

/**
 * Tells React what to render and where to render it.
 *
 * In our case, we're rending our root `App` component to the DOM element with
 * the id of `root` in the `public/index.html` file.
 */
ReactDOM.render(
    <App />,
    document.getElementById("root"),
);
```

At this point you can actually run the application. If you run `npm run develop` you should see the Webpack dev server come live and if you navigate to `http://localhost:3000`, you should see a page with "Hello from React!".

## Adding the Redux Store

Now let's add the [Redux](https://redux.js.org/) store to the application with a simple setup. 

To get started, add the `store` directory under the `src` directory. In this directory, create a `store.ts` file and a `user` directory that we'll use as a basic example. This `user` directory will be used to track state properties for the user. In this `user` directory, create `userSlice.ts` and `selectors.rs` files. Note that this is not a Redux tutorial so I highly recommend looking at the documentation if you need to familiarize yourself with how Redux works.

At this point your `src` directory should look like:

```
src/
    store/
        user/
            selectors.ts
            userSlice.ts
        store.ts
    App.css
    App.tsx
    index.tsx
```

We'll start with the `userSlice.ts` file. This file will define the structure of our user state, the initial state values and using the Redux toolkit we'll create the user slice and our actions.

We'll have a simple user state that keeps track of the user's name. The initial name will be "Bob" and we'll have an action to set the user's name to something else.

All this looks like:

```ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Defines a type for the user slice state.
interface UserState {
    name: string,
}

// Defines the initial state using the `UserState` type.
const initialState: UserState = {
    name: "Bob",
};

/**
 * Automatically generates action creators and types that correspond to the 
 * reducers and state.
 */
export const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        /**
         * Sets a new name for the user.
         * 
         * @param {UserState} state The user state.
         * @param {PayloadAction<string>} action The new name for the user.
         */
        setUserName: (state, action: PayloadAction<string>) => {
            state.name = action.payload;
        },
    },
})

/** Export our actions. */
export const { setUserName } = userSlice.actions;

/** Export our selectors. */
export * from "./selectors";

export default userSlice.reducer;
```

Note that the `@reduxjs/toolkit` is an abstraction to make working with Redux a lot easier. I recommend checking out the [documentation](https://redux-toolkit.js.org/) to see how you can use it to make Redux state management easier.

Now that we have the action to set the user's name, we should also have a selector to return the user's name. In the `selectors.ts` file, add the following.

```ts
import type { RootState } from "../store";

/**
 * Returns the name of the user.
 * 
 * @param {RootState} state The root state.
 * 
 * @returns {string}
 */
export const selectUserName = (state: RootState): string => state.user.name;
```

Now since the Redux store needs to be accessible throughout the application, we have to add the provider as the root component of the application. In the `src/index.tsx` file, wrap the `<App>` component in the Redux provider component.

```tsx
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";

import App from "./App";
import { store } from "./store/store";

/**
 * Tells React what to render and where to render it.
 *
 * In our case, we're rending our root `App` component to the DOM element with
 * the id of `root` in the `public/index.html` file.
 */
ReactDOM.render(
    <Provider store={store}>
        <App />
    </Provider>,
    document.getElementById("root"),
);
```

One more step before we can start using the dispatch and selectors, we need to make a simple hook, as [recommended by the Redux Toolkit documentation](https://redux-toolkit.js.org/usage/usage-with-typescript). This will help us use selectors and dispatch with proper typing.

In the `src` directory, create a `hooks` directory to store all of our application's hooks. In this directory, create a `stateHooks.ts` file and add the following contents.

```ts
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../store/store";

// Saves us having to type `(state: RootState)` every time.
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// For `useDispatch`, it saves us from having to remember to use `AppDispatch` for thunks.
export const useAppDispatch = () => useDispatch<AppDispatch>();
```

Now we're ready to make a couple components that can be used to set and get the user's name from the state. In the `src` directory, create a `components` directory. Within this, let's create a `Greeting.tsx`, which will show a greeting with the user's name, and a `NameChange.tsx` component which will allow the user to change their name.

Let's start with the `Greeting.tsx` component.

In this component, we need to import our `useAppSelector` hook that we created and also the selector to get the user's name. After that we simply use the selector to get the user's name from the store and display it.

**Note:** If you're not using TailwindCSS, don't worry about the class names.

```tsx
import React from "react";

import { useAppSelector } from "../hooks/stateHooks";
import { selectUserName } from "../store/user/selectors";

/**
 * Displays a greeting to the current user.
 */
const Greeting = () => {
    /** The name of the user. */
    const userName = useAppSelector(selectUserName);

    return <p className="text-3xl">Hello, {userName}</p>;
};

export default Greeting;
```

Next we'll work on the `NameChange.tsx` component. This component will be a bit more complicated. In this component, we'll import our `useAppDispatch` hook to use to call the action to change the user's name. We'll also have an input tied to a local state variable and when a submit button is pressed, we call a function to update the user's name in the store.

```tsx
import React, { useMemo, useState } from "react";

import { setUserName } from "../store/user/userSlice";
import { selectUserName } from "../store/user/selectors";
import { useAppDispatch, useAppSelector } from "../hooks/stateHooks";

/**
 * An input that allows the user to change their name.
 */
const NameChange = () => {
    const dispatch = useAppDispatch();

    /** The name of the user. */
    const userName = useAppSelector(selectUserName);

    /** The name of the user in the input, defaulting to the user name. */
    const [inputUserName, setInputUserName] = useState<string>(userName);

    /**
     * Indicates whether the user can use the "Submit" button to change their
     * name or not. This is only true if the name in the input is different
     * than the name in the state.
     */
    const canChangeName = useMemo(
        () => userName !== inputUserName,
        [userName, inputUserName],
    );

    /**
     * Called when the name of the user is updated in the input to update the
     * name in the local state.
     *
     * @param {React.ChangeEvent<HTMLInputElement>} event The change event.
     */
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) =>
        setInputUserName(event.target.value);

    /**
     * Called when the "Submit" button is pressed to set the new name for the
     * user in the store.
     */
    const handleNameChange = () => dispatch(setUserName(inputUserName));

    return (
        <div className="flex flex-col mt-4">
            <p>Don't like the name {userName}? Change It!</p>
            <div className="flex items-center gap-x-2 mt-3">
                <input
                    onChange={handleInputChange}
                    value={inputUserName}
                    className="border border-gray-400 rounded p-2"
                />
                <button
                    onClick={handleNameChange}
                    disabled={!canChangeName}
                    className={`${
                        canChangeName ? "bg-blue-500" : "bg-gray-400"
                    } text-white py-2 px-4 rounded`}
                >
                    Submit
                </button>
            </div>
        </div>
    );
};

export default NameChange;
```

When the user changes their name in the input, it updates the local state. Then, once the submit button is pressed, the `handleNameChange` function will dispatch the action and update the user's name in the store. This name change should then be reflected in the `Greeting.tsx` component.

Let's add these components to the `App.tsx` file so that we can see them.

```tsx
import React from "react";

import Greeting from "./components/Greeting";
import NameChange from "./components/NameChange";

import "./App.css";
import "tailwindcss/tailwind.css";

const App = () => {
    return (
        <div className="App">
            <div className="flex flex-col">
                <Greeting />
                <NameChange />
            </div>
        </div>
    );
};

export default App;
```

At this point you should be able to try this out. Run the local development server with `npm run develop` and on the main page at `http://localhost:3000` you should see both the `Greeting.tsx` and `NameChange.tsx` components. The greeting should initially display the name "Bob" but you can change it using the input and see the greeting update with the new value from the store.

## Conclusion

At this point hopefully you've developed a since of how the build process works and how it makes the React app come together. If you're still confused, it's completely fine. I recommend looking over the whole tutorial or just the parts that need clarification. I'd also highly recommend reading more into the build tools and packages that you don't understand well.

As mentioned at the beginning, the full template can be found on [GitHub](https://github.com/robertcorponoi/react-template).
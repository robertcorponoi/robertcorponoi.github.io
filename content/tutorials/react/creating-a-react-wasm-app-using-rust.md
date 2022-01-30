---
title: Creating a React Wasm App Using Rust
slug: creating-a-react-wasm-app-using-rust
date: "2022-01-29"
description: If you have performance critical parts of your React application, you could see improvements moving those parts to Wasm
tags: ["react", "wasm", "rust"]
---

If you have performance critical parts of your React application, you could see improvements moving those parts to Wasm. Luckily, this process is fairly easy if you take the time to understand each piece.

The source for this tutorial can be found on [GitHub](https://github.com/robertcorponoi/React-Rust-Wasm-Template).

There's going to be two main pieces, one of which will create another:

- React client for using the Wasm module
- Rust library for the Wasm source
- Wasm package (built by the Rust library)

**Table of Contents**
- [The React Client](#the-react-client)
- [The Rust Source](#the-rust-source)
- [Using the Wasm Package](#using-the-wasm-package)
- [Improving the Development Experience](#improving-the-development-experience)
- [Conclusion](#conclusion)

## The React Client

The React client is going to import the Wasm modules and use them. There's a couple ways that we could create the React client.

1. Using [Create React App](https://create-react-app.dev/). This is the fastest and most simple way to set up the React client. Note that if you do it this way, you'll have to `eject` as we'll have to change the `webpack.config.js` file to allow us to import Wasm modules.

**Note:** You might also be able to accomplish the same thing without ejecting, but with [craco](https://github.com/gsoft-inc/craco). I haven't tested this though so I can't guarantee the results.

2. My preferred method is to create the React client from scratch. I've written a [tutorial documenting the process](https://robertcorponoi.com/react/creating-a-react-app-without-react-scripts/) and have created a [template](https://github.com/robertcorponoi/react-template) that can be used.

## The Rust Source

The Rust source is going to be used to define our Wasm bindings and build them. To create this library, run the following command at the root next to the React client.

```bash
cargo new wasm --lib
```

**Note:** We name the library `wasm` but you can name it whatever you wish.

We're going to start here first.

The first thing we need to do is define the crate type to generate. In the `Cargo.toml` file, add the following above the `dependencies` section.

```toml
[lib]
crate-type = ["cdylib"]
path = "src/lib.rs"
```

On the topic of dependencies, we need to install the single dependency we need, [wasm-bindgen](https://github.com/rustwasm/wasm-bindgen). This dependency lets us easily tag the functions that we want to build as you'll see later in the tutorial.

To add this dependency, open up the `Cargo.toml` file and add it under the `dependencies` section.

```toml
[dependencies]
wasm-bindgen = "0.2.79"
```

We're pretty much done with the setup here. At this point we can head on over to the `src/lib.rs` file and add our functions that will be built.

Since this is a simple tutorial we'll just add a single function. This function will take a name as a parameter and print a simple greeting. This is not a good example of a function that you should use Wasm for, this particular function would be much faster in JavaScript/TypeScript.

Let's add this simple greeting function.

```rs
use wasm_bindgen::prelude::*;

/// Returns a simple greeting with the provided name.
/// 
/// `name` - The name to use in the greeting. 
#[wasm_bindgen]
pub fn greeting(name: String) -> String {
    format!("Hello, {}", name)
}
```

What's nice about the Rust types is that when we build the Wasm package, it'll come with type definitions that we can use in the React client in our TypeScript components.

At this point we're ready to build the Wasm package. To build it, we'll need to install a Rust binary, [wasm-pack](https://github.com/rustwasm/wasm-pack). Install `wasm-pack` with the following command.

```bash
cargo install wasm-pack
```

`wasm-pack` is a pretty simple command to use. We'll just call it and provide an `--out-dir` to where the built package will go. We'll set the out dir to the root so that it's in the same root directory as the React client and the Rust source.

```bash
wasm-pack build --out-dir ../wasm-build
```

This will build the Wasm package and create a new directory at the root named `wasm-build`. You can change the name `wasm-build` to whatever you wish but keep it in mind because you'll need to use the name later.

## Using the Wasm Package

Now that we have the built Wasm package, we can start to use it in the React client.

First, we have to modify our Webpack configuration so it knows how to handle the Wasm. This tutorial assumes that you're using a recent version of webpack and can use the [experiments configuration option](https://webpack.js.org/configuration/experiments/). This lets us easily turn on Wasm support by adding the following to the `webpack.config.js` file.

```js
experiments: {
    // Allows us to use WebAssembly.
    asyncWebAssembly: true,
},
```

Next, we have to add the Wasm package as a file system dependency to the React client. Open up the React client's `package.json` and add the Wasm package as the last dependency under the `dependencies` section.

```json
{
    "wasm": "file:../wasm-build"
}
```

**Note:** If you changed the output directory of `wasm-pack`, you'll need to replace `wasm-build` with the name of your directory.

You can also change the name of the package, `wasm`, to anything you like but again, keep it in mind because it'll be referenced coming up.

Now if you run `npm install`, a link will be created to the `wasm-build` in the local filesystem and we can start using the `wasm` package in our components.

To demonstrate, create a `Greeting.tsx` component under your `components` directory in the React client. We'll start with a basic greeting and replace it with our Wasm greeting function.

```tsx
import React from "react";

/**
 * Displays a greeting to the current user.
 */
const Greeting = () => {
    return <p>Hello, Bob</p>;
};

export default Greeting;
```

Now let's how we can replace the returned contents with our Wasm greeting function. All we have to do is import our greeting function just like any other package and use it in the return state.

```tsx
import React from "react";
import { greeting } from "wasm";

/**
 * Displays a greeting to the current user.
 */
const Greeting = () => {
    return <p>{greeting("Bob")}</p>;
};

export default Greeting;
```

Since `wasm-pack` also generates the typings we can import just functions we need and also make sure that when we use them, we pass the correct types for parameters and get the expected return type. It's incredibly easy to use thanks to the wonderful work of `wasm-pack`.

If you run `npm run develop` you should be able to see your application and as you change the name it will update. You can also play around with the arguments of the greeting function or create a new function entirely to get more comfortable with the process.

Note that whenever you change the Rust source, you have to run the `wasm-pack` command again to generate a new bundle. We'll go over how to improve that in the next section.

## Improving the Development Experience

Curently, anytime that you make a change to the Rust source, you have to run `wasm-pack` to generate a new build and then Webpack should pick up on the changes and reload automatically. This isn't a bad system since the React client can detect the Wasm pack build changing and fast refresh the dev server. However, we can improve this a little bit by creating a script that will watch the Rust source and run `wasm-pack` automatically, just like how Webpack watches the React client source and rebuilds.

To do this, we'll need to install another helper, [cargo-watch](https://github.com/watchexec/cargo-watch).

```bash
cargo install cargo-watch
```

Also so that we don't have to remember the command everytime we boot up our dev environment, let's save it to a script. In the Rust library, create a directory named `scripts`. Within this directory, create a file named `develop.sh` and give it executable permissions.

```bash
chmod +x ./scripts/develop.sh
```

Open this file and add the following contents.

```bash
# A script to watch for changes to the `wasm` directory and run `wasm-pack` to 
# rebuild the bundle.
# If you are running `npm run develop` on the React app, it will automatically 
# reload when the build is created.
# 
# Note: This requires:
# - wasm-pack https://github.com/rustwasm/wasm-pack
# - cargo-watch https://github.com/watchexec/cargo-watch
cargo watch -- wasm-pack build --out-dir ../wasm-build
```

What this script does is start up tell `cargo-watch` to watch our Rust source for changes. When changes are detected, we want to run the `wasm-pack` command to build our Wasm package.

You can try this out now by running the script. You should see in the terminal output that it creates the package. Now if you make any changes to the source, like adding another parameter or adding to the output, and save, you should see the build command run again.

If you run this `develop.sh` script in one terminal and then the React client's `npm run develop` in another, anytime you make changes to the Rust source the Wasm package will be built and then Webpack will pick up on the changes and update the dev server. This means that changes you make in the Rust source will be available to use and reflected in the frontend without restarting any services.

## Conclusion

I hope that this tutorial showed that it's not overly complicated to set up a React Wasm application and you can easily move performance critical code to a Wasm package to speed up your application.

In the next article we'll go over creating a GitHub actions workflow to build the Rust library, create the Wasm package, and build the React client. I'll update this tutorial when that one is out.

The source for this tutorial can be found on [GitHub](https://github.com/robertcorponoi/React-Rust-Wasm-Template).

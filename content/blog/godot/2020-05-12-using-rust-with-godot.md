---
title: Using Rust With Godot
slug: using-rust-with-godot
date: "2020-08-12"
description: Using Rust with Godot is easier than you think, especially with the help of Godot Rust CLI
tags: ["godot", "game-development"]
---

## **Note:** This information is outdated and will be updated soon.

## Welcome

to the first step of mastering Rust in Godot. Using Rust in Godot is great for performance critical code and can either be used on its own or to supplement existing gdscript. We're going to go over the process of setting it up manually and then how to do the same thing using [godot_rust_helper](https://github.com/robertcorponoi/godot_rust_helper).

## Manual Setup

During this section we'll go through the manual process of setting up a Rust development environment for your Godot project. If you would like to skip to the godot_rust_helper section, click [here](#using-godot_rust_helper).

## Creating the Project

The first step is to use cargo to create a new package. This should be done outside of your Game's directory as there can be performance issues if you do it in the same directory. I like to create mine in a different directory and use the exact same name as the game.

So let's say your game is at `~/Documents/Games/platformer`. I would create another directory in `Documents` to hold the library. In my case I have a `Projects` directory so I go in there and run `cargo new platformer --lib`.

This leaves me with the following directory structure:

`~/Documents/Games/platformer`
`~/Documents/Projects/platformer`

Now open up the newly created project in your favorite text editor and open up the `Cargo.toml` file created by cargo. You will need to add a couple lines including the gdnative dependency that is necessary to use the gdnative modules. Below is a sample Cargo.toml file that contains the necessary components needed:

```toml
[package]
name = "platformer"
version = "0.1.0"
authors = ["Bob <robertcorponoi@gmail.com>"]
edition = "2018"

[lib]
crate-type = ["cdylib"]

[dependencies]
gdnative = { git = "https://github.com/GodotNativeTools/godot-rust" }
```

Look closely at the parts under the package section, they are what are needed to create a basic working project.

## Create the Scripts

Before we can create our first script we have to set up the basics that let's Godot know how to handle our script. In your `src/lib.rs` file place the following boilerplate code:

```rust
#[macro_use]
extern crate gdnative;

fn init(handle: gdnative::init::InitHandle) {
}

godot_gdnative_init!();
godot_nativescript_init!(init);
godot_gdnative_terminate!();
```

This will let us create as many scripts as we want for the project and we can easily register as them as you'll see next. Now we're going to create a script called Player that will print "hello, world." to the console. To do this, add a new file under `src/` and name it `player.rs`. In the newly created `player.rs` file, add the following:

```rust
#[derive(gdnative::NativeClass)]
#[inherit(gdnative::Node)]
pub struct Player;

#[gdnative::methods]
impl Player {
	fn _init(_owner: gdnative::Node) -> Self {
		Player
	}

	#[export]
	fn _ready(&self, _owner: gdnative::Node) {
		godot_print!("hello, world.");
	}
}
```

Let's break this down a bit. Everything in this script except the `_ready` function is required in order for Godot to be able to use this script. The only thing we do in `_ready` is print the "hello, world." line. This article isn't going to be an in-depth guide on gdnative but great documentation can be found [here](https://docs.rs/gdnative/0.8.0/gdnative/index.html).

Now that we have our Player set up, we need to go back to the `src/lib.rs` file and register it with Godot.

```rust
#[macro_use]
extern crate gdnative;

// Pulls in the module file.
mod player;

fn init(handle: gdnative::init::InitHandle) {
  // Registers it with Godot.
  handle.add_class::<player::Player>();
}

godot_gdnative_init!();
godot_nativescript_init!(init);
godot_gdnative_terminate!();
```

Any other scripts you create will follow the same procedure, you add the `mod script_name` line and then you register it with `handle.add_class::<script_name::struct_name>();`. Before we move on make sure you run `cargo build` so that the dynamic library files get build and you can copy them into the Godot project for the next step.

## Create the Resource File

Now that we have our script set up, we need to create a resource file for our it. Each script you want to make will need its own resource file.

Here is an example Player.gdns file:

```
[gd_resource type="NativeScript" load_steps=2 format=2]

[ext_resource path="res://platformer.gdnlib" type="GDNativeLibrary" id=1]

[resource]

resource_name = "Player"
class_name = "Player"
library = ExtResource( 1 )
```

The three things that need to be changed in this example file are the `ext_resource_path`, `resource_name`, and `class_name`. The `ext_resource_path` needs to point to location of the gdnlib file we created in the step before. The name can be your class name either lowercase or capital but the most important part is the `class_name` which has to match the struct name in Rust.

**Note:** With this method everytime you change your scripts and run another build you will have to copy the dynamic libraries over the previous ones so that Godot can pick up on the changes.

## Set the Build Targets

This next part will depend on what platforms you plan on building for but for simplicity sake we'll just say windows. For this part we will need to create a gdnlib file that will let Godot know what dynamic libraries should be loaded for each platform.

Here is an example platformer.gdnlib file:

```
[general]

singleton=false
load_once=true
symbol_prefix="godot_"
reloadable=false

[entry]

Linux.64="res://libgdexample.so"
Windows.64="res://libgdexample.dll"
OSX.64="res://libgdexample.dylib"

[dependencies]

Linux.64=[]
Windows.64=[]
OSX.64=[]
```

Now let's break it down. The items under the general section control how the module is loaded and we have no need to change any of these. The entry section tells Godot the location of the dynamic library in the project's filesystem. So basically wherever we decide to place out build files, we need the paths to them to match here in the gdnlib file. For this example we're just assuming the files you built in the last step were placed in the root of the game's directory.

The dependencies section allows you to name additional dynamic libraries that should be included as well. This is useful if you need a third-party dynamic library to be used with your project but that's outside the scope of this tutorial.

## Using godot_rust_helper

All of the steps above were for the previous method which can take up a lot of time especially if you have incremental changes. This long setup and the constant need to keep copying over the new dynamic libraries let me to create [godot_rust_helper](https://github.com/robertcorponoi/godot_rust_helper). We're going to go through the same project setup as above but this time using the godot_rust_helper CLI.

First things first, you have to install godot_rust_helper using `cargo install godot_rust_helper`.

## Create the Project

To create a new project you have to specify the directory you would like it to reside in and the path to the Godot project that you are creating scripts for, just like in the previous section. We're going to assume the same directory structure as above and use:

```bash
$ godot_rust_helper new ~/Documents/Projects/platformer ~/Documents/Games/platformer
```

This will run `cargo new` and create the project while also automatically creating the gdnlib file in the Godot project. The `new` command also comes with several options to customize your usage:

- `--targets` Native components in Godot can target multiple platforms and godot_rust_helper needs to know ahead of time what platforms you plan to target your components for with the available options currently being: windows, linux, and osx. For example if you are targeting Windows and OSX, you need to have have cargo set to build a dll and a dylib file and you would pass `--targets=windows,osx` as the targets. By default if no targets are passed then just `--targets=windows` will be set.
- `--output-path` godot_rust_helper has to place a gdnlib file and the build files in the game's directory. By default these files are placed at the root of the game directory but you can specify a directory in the game (existing or not) where these files go instead using this option.
- `--nativescript-path` The path in the Godot project where all of the resource files will be output. By default the resource files are placed at the root of the Godot project.

So if you wanted the gdnlib and dynamic libraries to be placed in a directory called `gdr-output` and you wanted the resource files to be placed in `gdr-scripts` you would do:

```bash
$ godot_rust_helper new ~/Documents/Projects/platformer ~/Documents/Games/platformer --output-path ~/Documents/Games/platformer/gdr-output --nativescript-path ~/Documents/Games/platformer/gdr-scripts
```

## Create the Scripts

Creating a new script with godot_rust_helper is as simple as:

```bash
$ godot_rust_helper create Player
```

This creates the `player.rs` script and adds the entry for it in the `lib.rs` file. This even sets up the `player.rs` script with the basic "hello, world." example we showed above to get you started.

From here you can build the project by using:

```bash
$ godot_rust_helper build
```

or you can run a build that watches for changes with:

```bash
$ godot_rust_helper build --watch
```

The great thing about building this way is that it automatically moves the dynamic library files to the Godot project so you can run the build then go right back in Godot and press play to see the changes.

There are also a few other commands offered by godot_rust_helper so make sure to check out the full documentation including a detailed step-by-step guide on the GitHub [repo](https://github.com/robertcorponoi/godot_rust_helper).


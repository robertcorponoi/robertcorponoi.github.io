---
title: Creating a Simple Menu
slug: creating-a-simple-menu
date: "2021-10-25"
description: Learn how to build a simple menu with a few buttons.
tags: ["bevy", "game-development"]
---

## **Note:** This tutorial is for Bevy v0.5.0, It will be updated for v0.6.0 soon.

Recently I've gotten into [Bevy](https://github.com/bevyengine/bevy) and it's been a pretty fun journey. As with anything else I learn, I find the best way to do it is to attempt it and then write about it. What this means though is that this might not be the best solution but it's the solution I used. As I find better ways to do things, I'll update this tutorial.

This tutorial was inspired by the open source game [MurderUserDungeon](https://github.com/TheRealTeamFReSh/MurderUserDungeon) which is the game that got me started with Bevy.

## Getting Started

To get started, we need to create a new project:

```sh
cargo new bevy_simple_menu
```

Now in the generated `Cargo.toml` file, we need to add our dependencies. Since this is fairly simple, we'll just need bevy:

```toml
[dependencies]
bevy = "0.5.0"
```

## Bevy Basic Setup

Now that we've added Bevy as a dependency to our project, we can get started on the basic structure of a Bevy app.

The first things we'll need to do is create the Bevy app instance, add the default plugins, and then add a very basic camera system. Let's see what this looks like in the `src/main.rs` file:

```rust
use bevy::{prelude::*, window::WindowMode};

fn main() {
    let mut app = App::build();

    // Set the game to:
    // - be windowed
    // - have a resolution of 800x600
    // - no vsync
    // - not be able to be resized
    // - set the rest of the settings to their default values
    app.insert_resource(WindowDescriptor {
        width: 800.0,
        height: 600.0,
        title: "Bevy Simple Menu".to_string(),
        vsync: false,
        mode: WindowMode::Windowed,
        resizable: false,
        ..Default::default()
    });

    // Add the plugins we need.
    app.add_plugins(DefaultPlugins);

    // Start the game.
    app.run();
}
```

The first thing we do in the code above is declare what we need to use from Bevy. A popular thing we'll do throughout the tutorial is the glob imports to make things less confusing and less cluttered. Any keywords you see but don't recognize are most likely a part of `bevy::prelude` unless specified otherwise.

Below that, we specify the behaviour of our game window. We'll declare it as a simple windowed game with "Bevy Simple Menu" as the title of it. Other than that we'll use the default settings for anything not specified.

After that, we define the plugins that we are going to use. Bevy is very focused around plugins so everything we create will be a plugin. For the basic setup however, we'll just use Bevy's `DefaultPlugins`.

Lastly, we run the game!

At this point, if you run the game with `cargo run`, you'll notice a gray window with the properties we've specified.

Next, we'll add a basic camera system so we can see the results of what we're creating.

## Basic Camera System

First we create a new file under the `src` directory named `camera.rs`.

All we'll do here is use Bevy's default `UiCameraBundle`:

```rust
use bevy::prelude::{Commands, UiCameraBundle};

/// Creates the default camera for the game.
///
/// # Arguments
///
/// * `commands` - A list of commands used to modify a `World`.
pub fn spawn_ui_camera(mut commands: Commands) {
    commands.spawn_bundle(UiCameraBundle::default());
}
```

Now back in the `main.rs` file, we can add the camera system as a startup system before we run the game:

```rust
use bevy::{prelude::*, window::WindowMode};

// Bring in our camera
mod camera;

fn main() {
    let mut app = App::build();

    // Set the game to:
    // - be windowed
    // - have a resolution of 800x600
    // - no vsync
    // - not be able to be resized
    // - set the rest of the settings to their default values
    app.insert_resource(WindowDescriptor {
        width: 800.0,
        height: 600.0,
        title: "Bevy Simple Menu".to_string(),
        vsync: false,
        mode: WindowMode::Windowed,
        resizable: false,
        ..Default::default()
    });

    // Add the plugins we need.
    app.add_plugins(DefaultPlugins);

    // Add the camera as a startup system.
    app.add_startup_system(camera::spawn_ui_camera.system());

    // Start the game.
    app.run();
}
```

Next we'll work on adding our game states.

## Adding States

One of the core principles of game development is state management. We need to keep track of what states the game can be in and our transitions between those states.

Since this is a simple menu demo, we'll have three states: `MainGame`, `MainMenu`, and `ControlMenu`.

The `MainMenu` state is state that the user will be by default. Within the main menu, we'll also have a simple controls menu and so we need a `ControlMenu` state to keep track of whether the user is viewing the controls or not. Finally, the `MainGame` state will be transitioned to after the user has started the game and moved away from the main menu.

Let's see what this looks like in code. Create a file named `states.rs` and add the following:

```rust
#[derive(Debug, Clone, Eq, PartialEq, Hash)]
pub enum GameState {
    MainGame,
    MainMenu,
    ControlMenu,
}
```

Now that we have our game states, lets add the starting state, `MainMenu`, after the plugins but before where we add our camera system:

```rust
use bevy::{prelude::*, window::WindowMode};

// Bring in our states.
mod states;
mod camera;

fn main() {
    let mut app = App::build();

    // Set the game to:
    // - be windowed
    // - have a resolution of 800x600
    // - no vsync
    // - not be able to be resized
    // - set the rest of the settings to their default values
    app.insert_resource(WindowDescriptor {
        width: 800.0,
        height: 600.0,
        title: "Bevy Simple Menu".to_string(),
        vsync: false,
        mode: WindowMode::Windowed,
        resizable: false,
        ..Default::default()
    });

    // Add the plugins we need.
    app.add_plugins(DefaultPlugins);

    // Add the camera as a startup system.
    app.add_startup_system(camera::spawn_ui_camera.system());

    // Add the starting state. We want the user to start at the main menu.
    app.add_state(states::GameState::MainMenu);

    // Start the game.
    app.run();
}
```

Now that we've done the setup, we can finally get to creating the menu!

### Creating The Main Menu

Our main menu is going to be super simple, just three buttons: Play, Controls, and Exit.

The play button will set the game's state to be the `MainGame` state so that the game can start. The controls button will add the controls state so that the player can view the controls, and then the exit button will simply close the game.

Lets start by creating the structure of the menus. First create a directory named `menus`. Within the `menus` directory, create a `main_menu.rs` file.

Within this menu, lets start by defining what we need from our local crates and from Bevy:

```rust
// We need our game states so we can check what state we are in and states to
// transition to.
use crate::states::GameState;

// The Exit button is going to need to be able to close the game so we have to
// use `AppExit`.
use bevy::app::AppExit;

// A general purpose import for all of our Bevy needs.
use bevy::prelude::*;
```

Now, we need to define a struct for our main menu that we can pass along to Bevy and specify the context that we're working with.

```rust
pub struct MainMenu;
```

We also need an enum to define our menu buttons:

```rust
/// The buttons in the main menu.
#[derive(Clone, Copy)]
pub enum MenuItem {
    /// The play button is used to start the game.
    Play,
    /// The controls button is used to open the controls menu.
    Controls,
    /// The exit button is used to exit the game.
    Exit,
}
```

Next we need to define the function that will be used to build the main menu. In this function we will declare the layout of the menu, add the title of the game, and finally add our three buttons.

The documentation on a lot of this is still sparse but I'll attempt to be as in-depth as possible.

The function, which we'll call `setup_main_menu`, is going to take three parameters:

- `commands` - This is going to be used to create the menu container and pass in our `MainMenu` struct and the buttons.

- `asset_server` - We'll use the asset server to load a custom font. We need to specify a font or the text will not show. For the tutorial I'm going to use [Roboto Mono](https://fonts.google.com/specimen/Roboto+Mono?category=Monospace). You can download the font and add the `.ttf` file of the version that you want to use to an `assets/fonts` folder at the root of the game project.

- `clear_color` - We'll use this to set a simple black background for the menu. In a part of the tutorial we'll go over using background images.

Lets see what this function looks like so far:

```rust
/// Sets up the main menu by defining the layout, inserting the title text, and
/// spawning the buttons.
///
/// # Arguments
///
/// `commands` - Used to create the menu.
/// `asset_server` - Used to load our custom font.
/// `clear_color` - Used to create the solid background color for the main menu.
pub fn setup_main_menu(mut commands: Commands, asset_server: ResMut<AssetServer>, mut clear_color: ResMut<ClearColor>) {

}
```

Within this function, we'll start out by loading our font and setting the background color for the menu:

```rust
// Load our custom font.
let font: Handle<Font> = asset_server.load("fonts/RobotoMono-Regular.ttf");

// Set the background color of the menu to black.
clear_color.0 = Color::BLACK;
```

The next part is going to be the biggest chunk because we're going to define the layout, add the title, and then spawn the buttons.

```rust
commands
    // This is where we're going to define the layout of the main menu.
    .spawn_bundle(NodeBundle {
        style: Style {
            // We want the menu to take up 100% of the available width and
            // height. This means that on our 800x600 window, the menu will be
            // 800x600.
            size: Size {
                width: Val::Percent(100.0),
                height: Val::Percent(100.0),
            },
            // Align the items in the main menu to the center both horizontally
            // and vertically.
            flex_direction: FlexDirection::ColumnReverse,
            align_items: AlignItems::Center,
            justify_content: JustifyContent::SpaceEvenly,
            // Use the default styles for everything else.
            ..Style::default()
        },
        visible: Visible {
            is_visible: false,
            ..Visible::default()
        },
        ..NodeBundle::default()
    })
    .insert(MainMenu)
    // Next, we add in the title and buttons for the main menu.
    .with_children(|mut parent| {
        // Starting with the title. We'll just set our title to be the same as
        // the game title but with a larger font, and white to stick out on the
        // black background.
        parent.spawn_bundle(TextBundle {
            text: Text::with_section(
                "Bevy Simple Menu",
                TextStyle {
                    font: font.clone(),
                    font_size: 50.0,
                    color: Color::WHITE,
                },
                // Center the title both horizontally and vertically.
                TextAlignment {
                    vertical: VerticalAlign::Center,
                    horizontal: HorizontalAlign::Center,
                },
            ),
            ..TextBundle::default()
        });

        // Our buttons to spawn. This will show as an error until we define the
        // function but we'll do it next.
        spawn_button(&mut parent, font.clone(), MenuItem::Play);
        spawn_button(&mut parent, font.clone(), MenuItem::Controls);
        spawn_button(&mut parent, font.clone(), MenuItem::Exit);
    });
```

That was a lot but hopefully the comments in the code help explain it a bit. A lot of it is just styling so there's nothing really special going on. It just takes a bit of boilerplate to achieve a little bit of layout and text.

## Spawning Buttons

Next, lets look at defining the `spawn_button` function which, as you can see will take the font and the `MenuItem` to create a button from and spawn the button within the menu.

```rust
/// Spawns a button within the main menu.
///
/// # Arguments
///
/// * `parent` - The parent which we can use to spawn the buttons with.
/// * `font` - The font to use for the button text.
/// * `item` - The `MenuItem` to spawn a button for.
fn spawn_button(parent: &mut ChildBuilder, font: Handle<Font>, menu_item: MenuItem) {
    // Create the container for the button. This is more or less the same
    // properties as the menu layout.
    parent
        .spawn_bundle(ButtonBundle {
            style: Style {
                // The size of the button. We want a small button so we'll set
                // it to be 10% width of the screen and 30px high.
                size: Size {
                    width: Val::Percent(10.0),
                    height: Val::Px(30.0),
                },
                flex_direction: FlexDirection::ColumnReverse,
                align_items: AlignItems::Center,
                justify_content: JustifyContent::SpaceEvenly,
                ..Style::default()
            },
            ..ButtonBundle::default()
        })
        .insert(menu_item)
        // Next we'll create the text for the button depending on the `MenuItem`
        // that was provided.
        .with_children(|parent| {
            parent.spawn_bundle(TextBundle {
                style: Style::default(),
                text: Text::with_section(
                    // Set the text of the button depending on the `MenuItem` that
                    // it relates to.
                    match menu_item {
                        MenuItem::Play => "Play",
                        MenuItem::Controls => "Controls",
                        MenuItem::Exit => "Exit",
                    },
                    // If you decided to use a custom font you can pass it here
                    // and also define the background color of the button.
                    TextStyle {
                        font: font.clone(),
                        font_size: 20.0,
                        color: Color::DARK_GRAY,
                    },
                    // Align the text in the center both vertically and
                    // horizontally within the button container.
                    TextAlignment {
                        vertical: VerticalAlign::Center,
                        horizontal: HorizontalAlign::Center,
                    },
                ),
                ..TextBundle::default()
            });
        });
}
```

Any error around `spawn_button` within `create_main_menu` should now be gone because we defined it. Again, just like with `create_main_menu`, there's nothing too special here. The button again has a lot of boilerplate for styling and the only dynamic part it is the text of the button which depends on the `MenuItem` passed to the function.

Next let's focus on adding the click event handlers to the buttons so that they actually do something when the user clicks on them.

## Button Click Handlers

The function for the click events will be pretty simple. We'll check what `Menuitem` we're adding the click handler for and handle it accordingly.

- If the `Play` button is clicked, we'll push the `MainGame` state into the game's state to move away from the menu and into the main game.

- If the `Controls` button is clicked, we'll push the `ControlMenu` state into the game's state to move away from the main menu and into the controls menu.

- If the `Exit` button is clicked, we'll simply just exit the application.

Lets see how this looks:

```rust
/// Handles what should when then a menu item in the main menu is selected
/// by the user.
///
/// # Arguments
///
/// * `app_exit_events` - The event writer that will send the signal that the app should exit.
/// * `app_state` - The current state of the game.
/// * `query` - The query for the buttons in the menu.
pub fn handle_menu_item_interactions(
    mut app_exit_events: EventWriter<AppExit>,
    mut app_state: ResMut<State<GameState>>,
    query: Query<(&Interaction, &MenuItem)>,
) {
    query.for_each(|(interaction, item)| match interaction {
        // Define what should happen when the buttons are clicked.
        Interaction::Clicked => match item {
            // When the play button is clicked, we push the `MainGame` state to
            // start the game.
            MenuItem::Play => {
                app_state
                    .push(GameState::MainGame)
                    .map_err(|err| error!("Failed to start game: {}", err))
                    .unwrap();
            }
            // When the controls button is clicked, we push the `ControlMenu`
            //  state to open the controls menu.
            MenuItem::Controls => {
                app_state
                    .push(GameState::ControlMenu)
                    .map_err(|err| error!("Failed to open control menu: {}", err))
                    .unwrap();
            }
            // When the exit button is clicked, we send the `AppExit` event to
            // exit the application.
            MenuItem::Exit => app_exit_events.send(AppExit),
        },
        // Optionally, if you're interesting in adding hover effects to the
        // buttons, you can do so here.
        Interaction::Hovered => {}
        _ => {}
    });
}
```

You'll notice that we also have `Interaction::Hovered` defined but we don't use it. This is just to demonstrate how you can add mouse hover effects onto your buttons. Feel free to remove this entirely if you have no use for it.

At this point we're almost done, we just need to define the function that runs when the user is done with the menu and Bevy can tear it down.

## Menu Teardown

Essentially for the teardown process we'll query for the main menu and just despawn each entity within it like so:

```rust
/// Tears down the main menu by removing all entities that are part of the
/// main menu.
///
/// # Arguments
///
/// * `commands` - The commands used to modify the `World`.
/// * `query` - The query to get the main menu and its entities.
pub fn teardown_menu_items(mut commands: Commands, query: Query<Entity, With<MainMenu>>) {
    for entity in query.iter() {
        commands.entity(entity).despawn_recursive();
    }
}
```

At this point we're finally done with the main menu. Next, we need to add the system sets that will define when the main menu builds, when it gets torn down, and adds the interactions for the buttons.

## Menu States

Lets create a plugin for our `MainMenu` which will define when the main menu builds and gets torn down. We'll also define our interactions for the main menu, which as you'll remember, we added in the `handle_menu_item_click` function.

First, if you don't have a `mod.rs` file under `src/menus`, go ahead and create that.

Now we can start by importing our main menu and our game states:

```rust
use bevy::prelude::*;
use crate::states::GameState;

mod main_menu;
```

Next we'll create the struct to represent our `MenusPlugin`. We make it plural because we're also going to add the `ControlsMenu` to this:

```rust
pub struct MenusPlugin;
```

Now we have to define the implementation for `MenusPlugin`. this will consist of implementing Bevy's `Plugin` for our `MenusPlugin` and defining our state related changes inside of the `build` function called by Bevy.

```rust
impl Plugin for MenusPlugin {
    /// Called when the `App` registers the plugin to set the systems to run
    /// when the menus enter various states.
    ///
    /// # Arguments
    ///
    /// * `app` - The main Bevy app instance.
    fn build(&self, app: &mut AppBuilder) {
        // When the game state enters the `MainMenu` state, we build the main
        // menu.
        app.add_system_set(
            SystemSet::on_enter(GameState::MainMenu)
                .with_system(main_menu::setup_main_menu.system()),
        )
        // When the game state goes back into the `MainMenu` state, we build
        // the main menu.
        .add_system_set(
            SystemSet::on_resume(GameState::MainMenu)
                .with_system(main_menu::setup_main_menu.system()),
        )
        // When the game updates, we set the interactions for the main menu
        // buttons.
        .add_system_set(
            SystemSet::on_update(GameState::MainMenu)
                .with_system(main_menu::handle_menu_item_interactions.system()),
        )
        // When the game state is paused in the `MainMenu` state, we tear down
        // the main menu.
        .add_system_set(
            SystemSet::on_pause(GameState::MainMenu)
                .with_system(main_menu::teardown_menu_items.system()),
        )
        // When the game state exists the `MainMenu` state, we tear down the
        // main menu.
        .add_system_set(
            SystemSet::on_exit(GameState::MainMenu)
                .with_system(main_menu::teardown_menu_items.system()),
        );
    }
}
```

The above basically just registers our menu plugin with various events all revolving around the `MainMenu` state.

Finally we have one last step (for the main menu), registering the `MenusPlugin` with Bevy.

## Register MenusPlugin with Bevy

Back in our `main.rs` file, add `MenusPlugin` after the `DefaultPlugins` like so:

```rust
use bevy::{prelude::*, window::WindowMode};

mod menus;
mod camera;
mod states;

fn main() {
    let mut app = App::build();

    // Set the game to:
    // - be windowed
    // - have a resolution of 800x600
    // - no vsync
    // - not be able to be resized
    // - set the rest of the settings to their default values
    app.insert_resource(WindowDescriptor {
        width: 800.0,
        height: 600.0,
        title: "Bevy Simple Menu".to_string(),
        vsync: false,
        mode: WindowMode::Windowed,
        resizable: false,
        ..Default::default()
    });

    // Add the plugins we need.
    app.add_plugins(DefaultPlugins).add_plugin(menus::MenusPlugin);

    // Add the camera as a startup system.
    app.add_startup_system(camera::spawn_ui_camera.system());

    // Add the starting state. We want the user to start at the main menu.
    app.add_state(states::GameState::MainMenu);

    // Start the game.
    app.run();
}
```

Note that the syntax for adding the `MenusPlugin` is `add_plugin` not `add_plugins` as it is with the `DefaultPlugins`.

## Running It

To see what we've got so far, go ahead and use `cargo run`. You should be presented with a small windowed screen with a black background, a title that says "Bevy Simple Menu", and three buttons.

If you click on Play or Controls, it'll take you to a black screen (because we haven't defined anything past the main menu) and if you click on Exit it'll exit the game as intended.

Next, we'll add the controls menu. This is going to be a super simple menu in order to not make the tutorial longer than it has to be. You'll notice that it's not much different than the main menu because it's still just a menu but with different content. However, we'll still go over it because it's important to see the state switching.

## Controls Menu

First, create a `controls_menu.rs` file under the `menus` directory. Go ahead and add the same `use` statements as you did with the `main_menu`:

```rust
use crate::states::GameState;
use bevy::prelude::*;
```

Just like with the main menu, we need a struct for the controls menu but we'll also need one for a Back button that will take the user back to the main menu:

```rust
/// Represents the menu that displays the controls of the game.
pub struct ControlMenu;

/// Represents the button that returns the player to the main menu.
pub struct BackButton;
```

Now, just like the main menu, we'll need to create a function that sets up the controls menu.

We're going to look at the entire function at once because it is almost identical to the main menu. The only difference is that, since there's only one button (the Back button), we define it in the setup. In the main menu, we did this in a separate function because we had to conditionally handle three buttons.

```rust
/// Sets up the controls menu by defining the layout, inserting the title text, and
/// spawning the Back button.
///
/// # Arguments
///
/// * `commands` - A list of commands that will be run to modify a `World`.
/// * `asset_server` - Used to load assets from the filesystem on background threads.
pub fn setup_controls_menu(mut commands: Commands, asset_server: ResMut<AssetServer>) {
    // Load our custom font.
    let font: Handle<Font> = asset_server.load("fonts/RobotoMono-Regular.ttf");

    commands
        .spawn_bundle(NodeBundle {
            style: Style {
                size: Size {
                    width: Val::Percent(100.0),
                    height: Val::Percent(100.0),
                },
                flex_direction: FlexDirection::ColumnReverse,
                align_items: AlignItems::Center,
                justify_content: JustifyContent::SpaceEvenly,
                ..Style::default()
            },
            visible: Visible {
                is_visible: false,
                ..Visible::default()
            },
            ..NodeBundle::default()
        })
        .insert(ControlMenu)
        .with_children(|parent| {
            parent.spawn_bundle(TextBundle {
                style: Style { ..Style::default() },
                text: Text::with_section(
                    "Use \"WASD\" to move and \"E\" to interact with things.",
                    TextStyle {
                        font: font.clone(),
                        font_size: 24.0,
                        color: Color::WHITE,
                    },
                    TextAlignment {
                        vertical: VerticalAlign::Center,
                        horizontal: HorizontalAlign::Center,
                    },
                ),
                ..TextBundle::default()
            });
            parent.spawn_bundle(ButtonBundle {
                style: Style {
                    size: Size {
                        width: Val::Percent(10.),
                        height: Val::Px(30.),
                    },
                    flex_direction: FlexDirection::ColumnReverse,
                    align_items: AlignItems::Center,
                    justify_content: JustifyContent::SpaceEvenly,
                    ..Style::default()
                },
                ..ButtonBundle::default()
            })
            // Adds the "Back" button to return the user to the game.
            .insert(BackButton)
            .with_children(|parent| {
                parent.spawn_bundle(TextBundle {
                    style: Style::default(),
                    text: Text::with_section(
                        "Back",
                        TextStyle {
                            font,
                            font_size: 20.0,
                            color: Color::DARK_GRAY,
                        },
                        TextAlignment {
                            vertical: VerticalAlign::Center,
                            horizontal: HorizontalAlign::Center,
                        },
                    ),
                    ..TextBundle::default()
                });
            });
        });
}
```

Just like with the main menu, we'll need to define the teardown function:

```rust
/// Tears down the controls menu by removing all entities that are part of the
/// controls menu.
///
/// # Arguments
///
/// * `commands` - The commands used to modify the `World`.
/// * `query` - The controls menu query.
pub fn teardown_controls_menu(mut commands: Commands, query: Query<Entity, With<ControlMenu>>) {
    for entity in query.iter() {
        commands.entity(entity).despawn_recursive();
    }
}
```

Finally we need the click event handler for the Back button. When the Back button is clicked, we'll pop the last item off the game state so that the current state will be `MainMenu`:

```rust
/// When the Back button is clicked we pop the `ControlsMenu` state so that the
/// game goes back to the `MainMenu` state.
///
/// # Arguments
///
/// * `app_state` - The state of the app.
/// * `query` - The query for the back button.
pub fn handle_back_button_interaction(
    mut app_state: ResMut<State<GameState>>,
    query: Query<&Interaction, With<BackButton>>,
) {
    query.for_each(|interaction| match interaction {
        // When the back button is clicked, we return the user to their
        // previous state.
        Interaction::Clicked => {
            #[cfg(debug_assertions)]
            info!("Popped game state");

            app_state
                .pop()
                .map_err(|err| error!("Failed to return to main menu: {}", err))
                .unwrap();
        }

        // Hover effects can be applied here.
        Interaction::Hovered => {}
        // Catch all for interactions.
        Interaction::None => {}
    });
}
```

Next we need to add the conditions that define when the game should build and teardown the controls menu back in the `menus/mod.rs` file.

First add the `controls_menu` to scope:

```rust
```rust
use bevy::prelude::*;
use crate::states::GameState;

mod main_menu;
mod controls_menu;
```

Then add the system sets for it like we did with the main menu:

```rust
// When the game state enters the `ControlMenu` state, we build the
// controls menu.
app.add_system_set(
    SystemSet::on_enter(GameState::ControlMenu)
        .with_system(controls_menu::setup_controls_menu.system()),
)
// Add the interaction for the Back button in the controls menu.
.add_system_set(
    SystemSet::on_update(GameState::ControlMenu)
        .with_system(controls_menu::handle_back_button_interaction.system()),
)
// When the game state exits the `ControlMenu` state, we tear down the
// controls menu.
.add_system_set(
    SystemSet::on_exit(GameState::ControlMenu)
        .with_system(controls_menu::teardown_controls_menu.system()),
);
```

## Final Result

If you run `cargo run` now, you should see the same menu as before. However, if you click on the Controls button, you should be taken to another screen with the simple controls that we created. Pressing the Back button on this screen should take you back to the main menu.

When you're ready to add more to the game, make sure you add a condition that takes the player out of the `MainMenu` state when the Play button is clicked so that they can play your game!

The completed code for this tutorial can be found in the [tutorials GitHub repo](https://github.com/robertcorponoi/tutorials/tree/main/bevy/bevy_simple_menu).

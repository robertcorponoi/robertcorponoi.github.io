---
title: Unreal C++ Creating Interactive Actors
slug: unreal-creating-interactive-actors
date: "2020-08-12"
description: This is a custom description for SEO and Open Graph purposes, rather than the default generated excerpt. Simply add a description field to the frontmatter.
tags: ["unreal", "game-development"]
---

In this tutorial we're going to go over ways that you can create system for making objects that the player can interact with. We're going to go over a pure C++ way and then we'll also go over how to migrate some of the functionality to Blueprints so that you still get the power of C++ in the complex parts but ability to easily iterate or pass off work for the interaction parts.

If at any point you get stuck or want to see the example you can clone or download the [repo](https://github.com/robertcorponoi/unreal-cpp-an-in-depth-guide-to-creating-interactive-actors) and launch it in Unreal.

## **Getting Started**

To get started, let's see what we're going to need:

- **Player Character** - The PlayerCharacter is going to be the main player of the game is going to be what interacts with the interactive objects. This is mainly going to be a standard third person controller but we're going to add some methods to help it interact with the objects.

- **Interactive Actor** - This is going to be the main controller for our interactive objects. All of the interactive pieces will be components of this Actor and this will handle the majority of the functionality.

And that's it. Other than the above you'll need the meshes that you want to be interactive and what I'm using in the [repo](https://github.com/robertcorponoi/unreal-cpp-an-in-depth-guide-to-creating-interactive-actors) is the [Kenney Furniture Kit](https://www.kenney.nl/assets/furniture-kit). You can also use the material I used to give static meshes an outline to highlight when the player is looking at them. You can find this mesh in the [repo](https://github.com/robertcorponoi/unreal-cpp-an-in-depth-guide-to-creating-interactive-actors) under the Materials folder or you follow the tutorial I used to create it [here]().

Also if you're using the highlight material make sure that you add a Post Process Volume Actor in the scene and set it to have the highlight as a post process material and also make the bounds infinite. You can see an example of it in the [repo](https://github.com/robertcorponoi/unreal-cpp-an-in-depth-guide-to-creating-interactive-actors) if you've never done it before.

## **Player Character**

As explained in the section above, the PlayerCharacter is just the third person character script from the third person character demo project so if you want to see the script for it either check out the [repo](https://github.com/robertcorponoi/unreal-cpp-an-in-depth-guide-to-creating-interactive-actors) or just copy Unreal's third person character. When we add the bit to interact with objects we'll add a few lines to it but character movement is out of scope for this tutorial.

## **Interactive Actor**

Before we get into the code let's see what we'll need the InteractiveActor to do:

- We need to know all of the meshes that can be interacted with.
- We need a box collider so that we only run repetitive functions when we know the player is in range to interact with the object.
- We need some text to let the player know that they can interact with the object they're looking at.
- We need a timer and a function that will be run by that timer whenever the player is in interaction range.

So create a new C++ class with a base of Actor and name it `InteractiveActor`. Let's get into the code and we'll go over it in detail afterwards:

**InteractiveActor.h**

```cpp
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "InteractiveActor.generated.h"

class UStaticMeshComponent;

/**
 * Represents a series of interactive objects that the PlayerCharacter can
 * interact with.
 */
UCLASS()
class INTERACTIVEOBJECTS_API AInteractiveActor : public AActor
{
	GENERATED_BODY()
	
public:	
	// Sets default values for this actor's properties.
	AInteractiveActor();

	// The RootComponent of this Actor.
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
	class USceneComponent* Root;

	// The BoxComponent used as a collision trigger that lets us know when the
	// PlayerCharacter is close enough to interact with objects in this Actor.
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
	class UBoxComponent* BoxCollider;

	// The TextRenderComponent that appears above this Actor when the PlayerCharacter
	// is able to interact with a part of it.
	UPROPERTY(VisibleAnywhere, BlueprintReadWrite)
	class UTextRenderComponent* NoticeText;

	// The StaticMeshComponents that the PlayerCharacter can interact with.
	// If you're only using one interactive object and you don't need the
	// array then you can omit this as we'll add the interactive objects later.
	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	TArray<UStaticMeshComponent*> InteractiveObjects;

	// The interactive StaticMeshComponent currently being looked at.
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
	UStaticMeshComponent* ObjectCurrentlyBeingLookedAt;

	// Used to create a timer that runs a function every so often to check if
	// PlayerCharacter is looking at an object that can be interacted with or not.
	UPROPERTY()
	FTimerHandle PlayerLookTimer;

protected:
	// Called when the game starts or when spawned.
	virtual void BeginPlay() override;

public:	
	// Called every frame.
	virtual void Tick(float DeltaTime) override;

	// Called when the PlayerCharacter enters the BoxCollider's trigger area.
	UFUNCTION()
	void OnComponentEnterInteractionArea(UPrimitiveComponent* OverlappedComp, AActor* OtherActor, UPrimitiveComponent* OtherComp, int32 OtherBodyIndex, bool bFromSweep, const FHitResult& SweepResult);

	// Called when the PlayerCharacter leaves the BoxCollider's trigger area.
	UFUNCTION()
	void OnComponentLeaveInteractionArea(class UPrimitiveComponent* OverlappedComp, class AActor* OtherActor, class UPrimitiveComponent* OtherComp, int32 OtherBodyIndex);

	// Called when the PlayerCharacter interacts with an object in this Actor.
	UFUNCTION()
	void Interact();

	// Called when the PlayerCharacter has entered the BoxCollider's trigger
	// area and is looking around for objects to interact with.
	UFUNCTION()
	void LookForInteractions(APlayerCharacter* PlayerCharacter);
};
```

So in the header file we:

- Declare the base components we'll need. These include a `USceneComponent` as the Root Component (without this scaling and transforms of other components is tricky) and a `UBoxComponent` to use as a trigger collision box.

- Define an array to hold all of the objects that can be interact with. This array can be omitted if you only want a single interactive object as we'll add the interactive objects later.

- Define a variable to hold the interactive object the PlayerCharacter is currently looking at, if any.

- Define the timer that manages running the `LookForInteractions` method on a loop.

- Define two functions `OnComponentEnterInteractionArea` and `OnComponentLeaveInteractionArea` that are called when the PlayerCharacter enters and leaves the BoxCollider's trigger area.

- Define the `Interact` function that handles what happens when the PlayerCharacter presses the action to interact with an interactive object.

- Define the `LookForInteractions` function that is run on a loop when the PlayerCharacter is inside of the BoxCollider's trigger area.

That was mostly just definitions so lets get into the cpp file:

***InteractiveActor.cpp**

```cpp
#include "InteractiveActor.h"
#include "PlayerCharacter.h"
#include "Components/BoxComponent.h"
#include "Components/SceneComponent.h"
#include "Components/StaticMeshComponent.h"
#include "Components/TextRenderComponent.h"
#include "Camera/CameraComponent.h"

// To help us see what the PlayerCharacter is looking at.
#include "DrawDebugHelpers.h"

/**
 * Sets default values.
 */
AInteractiveActor::AInteractiveActor()
{
 	// Set this actor to call Tick() every frame. You can turn this off to improve performance if you don't need it.
	PrimaryActorTick.bCanEverTick = true;

	// Create the Root and set it as the RootComponent.
	Root = CreateDefaultSubobject<USceneComponent>(TEXT("Root"));
	SetRootComponent(Root);

	// Create the BoxComponent and set it to be a collision trigger and then
	// attach it to the RootComponent.
	BoxCollider = CreateDefaultSubobject<UBoxComponent>(TEXT("BoxCollider"));
	BoxCollider->SetGenerateOverlapEvents(true);
	BoxCollider->SetCollisionProfileName(TEXT("Trigger"));
	BoxCollider->SetupAttachment(Root);

	// Create the TextRenderComponent and add a generic "Press E to Interact"
	// message and set it to be invisible so the PlayerCharacter can't see it
	// and lastly attach it to the RootComponent.
	NoticeText = CreateDefaultSubobject<UTextRenderComponent>(TEXT("NoticeText"));
	NoticeText->SetRelativeLocation(FVector(0.f, 90.f, 80.f));
	NoticeText->SetText(FText::FromString("Press E to Interact"));
	NoticeText->SetTextRenderColor(FColor::Blue);
	NoticeText->SetVisibility(false);
	NoticeText->SetupAttachment(Root);
}

/**
 * Called when the game starts or when spawned.
 */
void AInteractiveActor::BeginPlay()
{
	Super::BeginPlay();
	
	// Set the methods that are used to respond to when the player enters or
	// leaves the BoxCollider's trigger area.
	BoxCollider->OnComponentBeginOverlap.AddDynamic(this, &AInteractiveActor::OnComponentEnterInteractionArea);
	BoxCollider->OnComponentEndOverlap.AddDynamic(this, &AInteractiveActor::OnComponentLeaveInteractionArea);
}

/**
 * Called every frame.
 *
 * @param DeltaTime The difference in time between the last frame and this one.
 */
void AInteractiveActor::Tick(float DeltaTime)
{
	Super::Tick(DeltaTime);
}

/**
 * When a component enters this Actor's BoxCollider trigger area we check to
 * see if that component belonged to the PlayerCharacter and if so we start
 * the timer that runs the method that checks to see what the PlayerCharacter
 * is looking at.
 *
 * @param OverlappedComp
 * @param OtherActor
 * @param OtherComp
 * @param OtherBodyIndex
 * @param bFromSweep
 * @param SweepResult
 */
void AInteractiveActor::OnComponentEnterInteractionArea(UPrimitiveComponent* OverlappedComp, AActor* OtherActor, UPrimitiveComponent* OtherComp, int32 OtherBodyIndex, bool bFromSweep, const FHitResult& SweepResult)
{
	// Return early if anything is null so we can avoid a potential crash.
	if ((OtherActor == nullptr) || (OtherActor == this) || (OtherComp == nullptr)) return;

	// Try to cast to `PlayerCharacter` to see if it was the PlayerCharacter
	// that entered the interaction area. If not we can return early.
	APlayerCharacter* PlayerCharacter = Cast<APlayerCharacter>(OtherActor);
	if (PlayerCharacter == nullptr) return;

	// Create a FTimerDelegate so that we can pass the PlayerCharacter object to
	// our `LookForInteractions` method.
	FTimerDelegate PlayerLookTimerDel;
	PlayerLookTimerDel.BindUFunction(this, FName("LookForInteractions"), PlayerCharacter);

	// Set a timer that runs the `LookForInteractions` method every 0.1s which
	// checks to see if a Player is looking at an object that can be interacted with.
	if (GetWorld())
	{
		GetWorld()->GetTimerManager().SetTimer(PlayerLookTimer, PlayerLookTimerDel, 0.1f, true);
	}
}

/**
 * When a component leaves this Actor's BoxCollider trigger area we check to see
 * if it was the PlayerCharacter and if so we stop the timer and hide the notice text.
 *
 * @param OverlappedComp
 * @param OtherActor
 * @param OtherComp
 * @param OtherBodyIndex
 */
void AInteractiveActor::OnComponentLeaveInteractionArea(class UPrimitiveComponent* OverlappedComp, class AActor* OtherActor, class UPrimitiveComponent* OtherComp, int32 OtherBodyIndex)
{
	// Return early if anything is null so we can avoid a potential crash.
	if ((OtherActor == nullptr) || (OtherActor == this) || (OtherComp == nullptr)) return;

	// Try to cast to `PlayerCharacter` to see if it was the PlayerCharacter
	// that left the interaction area. If not we can return early.
	APlayerCharacter* PlayerCharacter = Cast<APlayerCharacter>(OtherActor);
	if (PlayerCharacter == nullptr) return;

	// Stop the timer that checks for the player interacting with objects as
	// the player is no longer in range to do so.
	if (GetWorld())
	{
		GetWorld()->GetTimerManager().ClearTimer(PlayerLookTimer);
	}
}

/**
 * Run on a timer when the PlayerCharacter enters the BoxCollider's trigger area
* and it checks to see if the PlayerCharacter is looking at any objects that can
* be interacted with by sending a trace from the PlayerCharacter's camera and
* checking for blocking collisions.
* 
* @param PlayerCharacter The PlayerCharacter that entered the BoxCollider's bounds.
 */
void AInteractiveActor::LookForInteractions(APlayerCharacter* PlayerCharacter)
{
	FHitResult OutHit;
	FCollisionQueryParams CollisionParams;

	// Set the start of the trace to be the player's camera.
	FVector Start = PlayerCharacter->PlayerCamera->GetComponentLocation();
	FVector ForwardVector = PlayerCharacter->PlayerCamera->GetForwardVector();

	// Set the end of the trace to be 1000.f units from the start in the direction
	// the player is facing.
	FVector End = ((ForwardVector * 1000.f) + Start);

	// DEBUG
	DrawDebugLine(GetWorld(), Start, End, FColor::Green, false, 1, 0, 1);

	// If there's no collision or the collision wasn't a blocking collision then
	// we can return early.
	if (!GetWorld()->LineTraceSingleByChannel(OutHit, Start, End, ECC_Visibility, CollisionParams)) return;
	if (!OutHit.bBlockingHit) return;

	// If there's no component then we also return early because we only deal
	// with the components of the InteractiveObjects.
	if (OutHit.GetComponent() == nullptr) return;

	// Attempt to cast the component to a UStaticMeshComponent and return early
	// if we can't.
	UStaticMeshComponent* InteractiveComponentHit = Cast<UStaticMeshComponent>(OutHit.GetComponent());
	if (InteractiveComponentHit == nullptr) return;

	// ...
}

/**
 * When this Actor is interacted with we...
 */
void AInteractiveActor::Interact()
{
	// Nothing here yet.
}
```

Alright that was quite a bit so lets break it down:

- We have to make sure we include all of the header files of the components we forward declared in the header file. We also include `DrawDebugHelpers.h` so we can see the trace we perform.

- In the constructor we set up the components we defined in the header. This includes the Root Component, the BoxCollider, and the NoticeText and all of their default values.

- In `BeginPlay` we assign the methods that are meant to respond to a component entering/exiting the BoxCollider's trigger area which are `OnComponentEnterInteractionArea` and `OnComponentLeaveInteractionArea`.

- Now in `OnComponentEnterInteractionArea`, which again is called when a component enters the trigger area, we check to see if it is the PlayerCharacter and if so we bind the `LookForInteractions` method to run on a timer every 0.1 seconds. We need to use `FTimerDelegate` since we want to pass a parameter to `LookForInteractions` which is the PlayerCharacter. The `true` at the end of `SetTimer` means that this timer will loop every 0.1 seconds and keep calling `LookForInteractions` until it is stopped. We also set the NoticeText to be visible.

- In `OnComponentLeaveInteractionArea`, which is called when a component exits the trigger area, we check again check to see if it is the PlayerCharacter and if so we cancel the timer we set in `OnComponentEnterInteractionArea` so that `LookForInteractions` is no longer being called as the PlayerCharacter is no longer in range of any objects they can interact with. We also set the NoticeText to not be visible again.

- In `LookForInteractions`, which is set to be run on a loop every X seconds once the PlayerCharacter has entered the BoxCollider's trigger area, we send out a trace from the PlayerCharacter's camera and see if it collides with anything. If there's a collision we check to see if that collision is one of the interactive objects in the `InteractiveObjects` array and if so we don't do anything yet. We'll be adding that functionality in soon.

- Lastly, `Interact` is going to be called when the PlayerCharacter presses the button to interact with an object but we're not ready to do that yet.

So that was a bit much but just make sure you get a good understanding of it before moving on. Also make sure that the above compiles for you and lets get to adding interactive objects to our Actor.

## **Adding Interactive Objects**

If you drag out the `InteractiveActor` onto the scene you'll see...nothing. This is because we haven't added any meshes or anything we can see yet. In this section we're going to add a simple block and smaller block to act as a makeshift lever that our PlayerCharacter is going to interact with to move.

So back in the `InteractiveActor.h` script add the following below the definition for the `Root` component:

**InteractiveActor.h**

```cpp
// The RootComponent of this Actor.
UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
class USceneComponent* Root;

// A non-interactive desk.
UPROPERTY(VisibleAnywhere, BlueprintReadWrite)
UStaticMeshComponent* Desk;

// An interactive drawer in the desk that the PlayerCharacter can interact with.
UPROPERTY(VisibleAnywhere, BlueprintReadWrite)
UStaticMeshComponent* DeskDrawer;
```

Now lets setup the meshes in the cpp file and position them so that the drawer is positioned in the correct place in the desk.

**InteractiveActor.cpp**

```cpp
// Load the meshes used for the Desk and Drawer.
static ConstructorHelpers::FObjectFinder<UStaticMesh>DeskMeshAsset(TEXT("StaticMesh'/Game/Models/Furniture/Desk/desk_desk.desk_desk'"));
static ConstructorHelpers::FObjectFinder<UStaticMesh>DeskDrawerMeshAsset(TEXT("StaticMesh'/Game/Models/Furniture/Desk/desk_drawer.desk_drawer'"));

// Create the Root and set it as the RootComponent.
Root = CreateDefaultSubobject<USceneComponent>(TEXT("Root"));
SetRootComponent(Root);

// Create the BoxComponent and set it to be a collision trigger and then
// attach it to the RootComponent.
BoxCollider = CreateDefaultSubobject<UBoxComponent>(TEXT("BoxCollider"));
BoxCollider->SetGenerateOverlapEvents(true);
BoxCollider->SetCollisionProfileName(TEXT("Trigger"));
// Update: Change the box extent and the position so that it extends mostly
// in front of the lever.
BoxCollider->SetRelativeLocation(FVector(0.f, 0.f, 20.f));
BoxCollider->SetBoxExtent(FVector(150.f, 100.f, 80.f));
BoxCollider->SetupAttachment(Root);

// Create the component for the Desk, set its mesh and position and then
// attach it to the Root.
Desk = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("Desk"));
Desk->SetRelativeLocation(FVector(0.f, 110.f, -40.f));
Desk->SetRelativeRotation(FRotator(0.f, 90.f, 0.f));
Desk->SetRelativeScale3D(FVector(2.f, 2.f, 2.f));
Desk->SetStaticMesh(DeskMeshAsset.Object);
Desk->SetupAttachment(Root);

// Create the component for the Drawer, set its mesh and position and
// attach it to the Desk.
DeskDrawer = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("DeskDrawer"));
DeskDrawer->SetStaticMesh(DeskDrawerMeshAsset.Object);
DeskDrawer->SetupAttachment(Desk);
```

**Note:** As mentioned earlier, these assets are from the [Kenney Furniture Kit](https://www.kenney.nl/assets/furniture-kit). I just copied over the desk fbx into a Models folder and it imports both the desk and the desk drawer. These are the same assets used in the [repo](https://github.com/robertcorponoi/unreal-cpp-an-in-depth-guide-to-creating-interactive-actors).

The component tree will look something like this (mine looks a bit different as it's a copy from the repo and it has extra elements):

![Component Overview](../../images/aug/unreal-an-in-depth-guide-to-creating-interactive-actors/component-overview.png)

Alright so a bit more than in the header but it's pretty simple. Since we're actually adding things we want to change the extents of the box collider so that we have a decent area in front of the desk where the PlayerCharacter can see that it's interactive. Then we just create the Desk and DeskDrawer meshes and setup their location/position so that the drawer is a part of the desk.

Now we have to add the DeskDrawer to the `InteractiveObjects` array. We can do this in the constructor but I prefer do it in `BeginPlay`:

**InteractiveActor.cpp**

```cpp
/**
 * Called when the game starts or when spawned.
 */
void AInteractiveActor::BeginPlay()
{
	Super::BeginPlay();
	
	// Set the methods that are used to respond to when the player enters or
	// leaves the BoxCollider's trigger area.
	BoxCollider->OnComponentBeginOverlap.AddDynamic(this, &AInteractiveActor::OnComponentEnterInteractionArea);
	BoxCollider->OnComponentEndOverlap.AddDynamic(this, &AInteractiveActor::OnComponentLeaveInteractionArea);

	// Add the DeskDrawer to the `InteractiveObjects` array.
	// If you just have a single interactive object and therefore don't have
	// an `InteractiveObjects` array you can omit this.
	InteractiveObjects.Add(DeskDrawer);
}
```

At this point you might be wondering why `InteractiveObjects` is an array if we only add one thing. If you only plan to have 1 item be interactive then you don't need an array and you can just check for that single item as I'll show below. This tutorial shows how to use multiple interactive pieces as that's more complex and is useful in situations like a control panel where you might have multiple buttons and levers and you can check out the [repo](https://github.com/robertcorponoi/unreal-cpp-an-in-depth-guide-to-creating-interactive-actors) for a more complex example.

Now let's add the functionality that loops through the `InteractiveObjects` array and looks to see if the Player is looking at any of them. So in the `LookForInteractions` method, which again runs while the PlayerCharacter is near the `InteractiveActor`, we can do:

```cpp
/**
 * Run on a timer when the PlayerCharacter enters the BoxCollider's trigger area
 * and it checks to see if the PlayerCharacter is looking at any objects that can
 * be interacted with by sending a trace from the PlayerCharacter's camera and
 * checking for blocking collisions.
 * 
 * @param PlayerCharacter The PlayerCharacter that entered the BoxCollider's bounds.
 */
void AInteractiveActor::LookForInteractions(APlayerCharacter* PlayerCharacter)
{
	FHitResult OutHit;
	FCollisionQueryParams CollisionParams;

	// Set the start of the trace to be the player's camera.
	FVector Start = PlayerCharacter->PlayerCamera->GetComponentLocation();
	FVector ForwardVector = PlayerCharacter->PlayerCamera->GetForwardVector();

	// Set the end of the trace to be 1000.f units from the start in the direction
	// the player is facing.
	FVector End = ((ForwardVector * 1000.f) + Start);

	// DEBUG
	DrawDebugLine(GetWorld(), Start, End, FColor::Green, false, 1, 0, 1);

	// If there's no collision or the collision wasn't a blocking collision then
	// we can return early.
	if (!GetWorld()->LineTraceSingleByChannel(OutHit, Start, End, ECC_Visibility, CollisionParams)) return;
	if (!OutHit.bBlockingHit) return;

	// If there's no component then we also return early because we only deal
	// with the components of the InteractiveObjects.
	if (OutHit.GetComponent() == nullptr) return;

	// Attempt to cast the component to a UStaticMeshComponent and return early
	// if we can't.
	UStaticMeshComponent* InteractiveComponentHit = Cast<UStaticMeshComponent>(OutHit.GetComponent());
	if (InteractiveComponentHit == nullptr) return;

	// If the component that the PlayerCharacter is looking at is not part of the
	// array of interactive objects then we can return early.
	if (!InteractiveObjects.Contains(InteractiveComponentHit))
	{
		if (ObjectCurrentlyBeingLookedAt != nullptr)
		{
			// Set `RenderCustomDepth` to be false so that the object isn't highlighted anymore.
			ObjectCurrentlyBeingLookedAt->SetRenderCustomDepth(false);

			// Set the NoticeText to be invisible since the player can no longer interact with
			// with this object anymore.
			NoticeText->SetVisibility(false);
		}

		// Lastly since the PlayerCharacter is no longer looking at a valid interactive object
		// then we set `ObjectCurrentlyBeingLookedAt` to a nullptr and return.
		ObjectCurrentlyBeingLookedAt = nullptr;
		return;
	}

	// Loop through all of the objects marked as interactive and if the player
	// is currently looking at one of them then highlight it and set it as the
	// new value for `ObjectCurrentlyBeingLookedAt`.
	for (UStaticMeshComponent* InteractiveObject : InteractiveObjects)
	{
		if (InteractiveObject == InteractiveComponentHit)
		{
			// Set the `InteractiveComponentHit` to be the new value of `ObjectCurrentlyBeingLookedAt`
			// since that's what the PlayerCharacter is currently looking at.
			ObjectCurrentlyBeingLookedAt = InteractiveComponentHit;

			// Set `RenderCustomDepth` to be true so that the highlight is
			// added to the object.
			ObjectCurrentlyBeingLookedAt->SetRenderCustomDepth(true);

			// Set the NoticeText to be visible so the player knows that they can interact with it.
			NoticeText->SetVisibility(true);

			// Break out of the loop early since we only want to deal with one
			// interactive object at a time.
			break;
		}
	}

	// For a single interactive object you could do:
	// if (InteractiveObject != InteractiveComponentHit)
	// {
	//   DeskDrawer->SetRenderCustomDepth(false);
	//   NoticeText->SetVisibility(false);
	//   return;
	// }
	//
	// DeskDrawer->SetRenderCustomDepth(true);
	// NoticeText->SetVisibility(true)
}
```

Now here we added a bit more. The first check is to check if what the PlayerCharacter is currently looking at is in the array of interactive objects and if not we turn off the notice text and highlight for the previous value of `ObjectCurrentlyBeingLookedAt` if there was one and return early.

After that we loop through all of the interactive objects to see if the PlayerCharacter is currently looking at one of them and if they are then we set that as the new `ObjectCurrentlyBeingLookedAt` and we set it to be highlighted.

If you compile this and drag out the `InteractiveActor` onto the scene and hit play you'll notice two things. When you get in range of the InteractiveActor's BoxCollider trigger area you'll see the traces being run from the PlayerCharacter's camera to check what the PlayerCharacter is looking at. Now use those traces to help you guide the camera towards the DeskDrawer and when you look at it you should see it highlighted. You should also see the NoticeText pop up and let the PlayerCharacter know they can interact with the DeskDrawer but that doesn't do anything yet until we add it in the next section.

## **Implementing Interaction**

So as of right now our PlayerCharacter can get in range of the InteractiveActor we'll see the traces and if they look at an interactive object, like the DeskDrawer, they'll see a highlight around the item letting them know that they can interact with it but now we have to implement the actual interaction. This is going to involve changes to the PlayerCharacter and the InteractiveActor.

![Highlighted Object](../../images/aug/unreal-an-in-depth-guide-to-creating-interactive-actors/highlighted-object.png)

First lets get into what we have to add to the PlayerCharacter as it's pretty minimal.

- We need to add a variable that is populated by the InteractiveActor the PlayerCharacter is looking at.

- We need to add an `Interact` method that is called when the interact action key is pressed.

**PlayerCharacter.h**

Where your other properties are declared:

```cpp
// The InteractiveActor that the PlayerCharacter is nearby.
UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
class AInteractiveActor* InteractionArea;
```

and then later down where you declare the methods:

```cpp
// Called when the "Interact" action is used.
void Interact();
```

Now in the cpp file we have to bind the action to the method and declare it like so:

**PlayerCharacter.cpp**

```cpp
/**
 * Called to bind functionality to input.
 *
 * @param PlayerInputComponent An Actor component that enables us to bind axis events and action inputs to methods.
 */
void APlayerCharacter::SetupPlayerInputComponent(UInputComponent* PlayerInputComponent)
{
	Super::SetupPlayerInputComponent(PlayerInputComponent);

	// When the mouse is moved we turn the player.
	PlayerInputComponent->BindAxis("Turn", this, &APlayerCharacter::AddControllerYawInput);
	PlayerInputComponent->BindAxis("LookUpDown", this, &APlayerCharacter::AddControllerPitchInput);

	// When the "Move_ForwardBack" or "Move_LeftRight" axis is used we call the methods to make
	// that happen.
	PlayerInputComponent->BindAxis("Move_ForwardBack", this, &APlayerCharacter::MoveForwardBack);
	PlayerInputComponent->BindAxis("Move_LeftRight", this, &APlayerCharacter::MoveLeftRight);

	// When the "Interact" action is used we call the `Interact` method.
	PlayerInputComponent->BindAction("Interact", IE_Pressed, this, &APlayerCharacter::Interact);
}

/**
 * When the player presses the interact action button we check to see
 * if `InteractionArea` is populated. If it's not populated then we return
 * as there's nothing to interact with otherwise we call that InteractiveActor's
 * `Interact` method.
 */
void APlayerCharacter::Interact()
{
	if (InteractionArea == nullptr) return;
	InteractionArea->Interact();
}
```

So all we did above was use `BindAction` to bind the interact button being pressed with the `Interact` method being run. Note that mine also contains the bindings for turning and moving and if you used a different Character script yours might look slightly different but it doesn't matter as long as the interaction action is bound.

Below that we declare the `Interact` method which checks to make sure we're near an `InteractiveActor` and if so we run that `InteractiveActor`s `Interact` method.

So now we head on over to InteractiveActor where we have to do the following:

- Set the `InteractionArea` property of the PlayerCharacter when they are in the BoxCollider's trigger area.

- Define what should happen when the PlayerCharacter calls this InteractiveActor's `Interact` method.

All of this takes place in the InteractiveActor.cpp file.

**InteractiveActor.cpp**

```cpp
/**
 * When a component enters this Actor's BoxCollider trigger area we check to
 * see if that component belonged to the PlayerCharacter and if so we start
 * the timer that runs the method that checks to see what the PlayerCharacter
 * is looking at.
 *
 * @param OverlappedComp
 * @param OtherActor
 * @param OtherComp
 * @param OtherBodyIndex
 * @param bFromSweep
 * @param SweepResult
 */
void AInteractiveActor::OnComponentEnterInteractionArea(UPrimitiveComponent* OverlappedComp, AActor* OtherActor, UPrimitiveComponent* OtherComp, int32 OtherBodyIndex, bool bFromSweep, const FHitResult& SweepResult)
{
	// Return early if anything is null so we can avoid a potential crash.
	if ((OtherActor == nullptr) || (OtherActor == this) || (OtherComp == nullptr)) return;

	// Try to cast to `PlayerCharacter` to see if it was the PlayerCharacter
	// that entered the interaction area. If not we can return early.
	APlayerCharacter* PlayerCharacter = Cast<APlayerCharacter>(OtherActor);
	if (PlayerCharacter == nullptr) return;

	// Set this InteractiveActor to be the value of the PlayerCharacter's
	// `InteractionArea` so if they press the interact button we know they want
	// to interact with an interactive object in this InteractiveActor.
	PlayerCharacter->InteractionArea = this;

	// Create a FTimerDelegate so that we can pass the PlayerCharacter object to
	// our `LookForInteractions` method.
	FTimerDelegate PlayerLookTimerDel;
	PlayerLookTimerDel.BindUFunction(this, FName("LookForInteractions"), PlayerCharacter);

	// Set a timer that runs the `LookForInteractions` method every 0.1s which
	// checks to see if a Player is looking at an object that can be interacted with.
	if (GetWorld())
	{
		GetWorld()->GetTimerManager().SetTimer(PlayerLookTimer, PlayerLookTimerDel, 0.1f, true);
	}
}

/**
 * When a component leaves this Actor's BoxCollider trigger area we check to see
 * if it was the PlayerCharacter and if so we stop the timer and hide the notice text.
 *
 * @param OverlappedComp
 * @param OtherActor
 * @param OtherComp
 * @param OtherBodyIndex
 */
void AInteractiveActor::OnComponentLeaveInteractionArea(class UPrimitiveComponent* OverlappedComp, class AActor* OtherActor, class UPrimitiveComponent* OtherComp, int32 OtherBodyIndex)
{
	// Return early if anything is null so we can avoid a potential crash.
	if ((OtherActor == nullptr) || (OtherActor == this) || (OtherComp == nullptr)) return;

	// Try to cast to `PlayerCharacter` to see if it was the PlayerCharacter
	// that left the interaction area. If not we can return early.
	APlayerCharacter* PlayerCharacter = Cast<APlayerCharacter>(OtherActor);
	if (PlayerCharacter == nullptr) return;

	// Set the InteractionArea of the PlayerCharacter to be a nullptr so that
	// they can't interact with this InteractiveActor when not in range.
	PlayerCharacter->InteractionArea = nullptr;

	// Stop the timer that checks for the player interacting with objects as
	// the player is no longer in range to do so.
	if (GetWorld())
	{
		GetWorld()->GetTimerManager().ClearTimer(PlayerLookTimer);
	}
}
```

So what we did above was just set and remove the `InteractionArea` for the PlayerCharacter when they enter and leave the BoxCollider trigger area of this InteractiveActor.

Now finally to the `Interact` method. This part is highly customizable and we'll go about a couple different ways to do this. Since we're having the PlayerCharacter interact with a drawer we'll just have its Y position change to simulate it being opened.

```cpp
/**
 * When this Actor is interacted with we check to see what object it is and
 * perform the interaction for that object.
 */
void AInteractiveActor::Interact()
{
	if (ObjectCurrentlyBeingLookedAt == nullptr) return;

	// If you only want 1 interactive object per InteractiveActor or you want to do the
	// same thing for every interactive object you can you can just check to see if
	// `ObjectCurrentlyBeingLookedAt` is null or not and if not you can do the interaction
	// logic like so:
	// FVector CurrentLocation = ObjectCurrentlyBeingLookedAt->GetRelativeLocation();
	// ObjectCurrentlyBeingLookedAt->SetRelativeLocation(FVector(CurrentLocation.X, -20.0f, CurrentLocation.Z));

	// Otherwise if you have multiple interactive objects you can check their name
	// and perform a different action for each one.
	FString InteractiveComponentName = ObjectCurrentlyBeingLookedAt->GetName();

	if (InteractiveComponentName == FString("DeskDrawer"))
	{
		// If the PlayerCharacter is interacting with the desk drawer then we want to
		// move the desk drawer to that it looks like it was opened.
		FVector CurrentLocation = ObjectCurrentlyBeingLookedAt->GetRelativeLocation();
		ObjectCurrentlyBeingLookedAt->SetRelativeLocation(FVector(CurrentLocation.X, -20.0f, CurrentLocation.Z));
	}
}
```

In the example above I included a snippet that shows how to implement this if you only plan on having 1 interactive object per `InteractiveActor` or if you want to do the same thing for every interactive object. If you're using an array of interactive objects then you want to take the second approach and check to see what the name of it is if you want to do a different action for each object.

**Note:** Make sure you set an action in the Input map marked as "Interact"

So now if you compile this and hit play and you go to desk and look at the drawer it will be highlighted like before but now if you press the button you set for interact you'll see the desk drawer being opened.

![Desk Drawer Open](../../images/aug/unreal-an-in-depth-guide-to-creating-interactive-actors/desk-drawer-open.png)

## **Multiple InteractiveActors**

This current setup works great if you just have a specialized InteractiveActor but what if you want more? Like if you want an interactive desk and a dresser and a control panel? This can be solved by script or Blueprints and we'll go over how to do that next.

If you want to keep a pure C++ solution then we can achieve multiple InteractiveActors by making InteractiveActor generic like so:

- Remove the Desk and DeskDrawer meshes from the header and cpp file as they are unique to each InteractiveActor.

- Changing the definition of the `Interact` method to be virtual.

- Removing most of the functionality of the `Interact` method.

**InteractiveActor.h**

Removing the following lines:

```cpp
// A non-interactive desk.
UPROPERTY(VisibleAnywhere, BlueprintReadWrite)
UStaticMeshComponent* Desk;

// An interactive drawer in the desk that the PlayerCharacter can interact with.
UPROPERTY(VisibleAnywhere, BlueprintReadWrite)
UStaticMeshComponent* DeskDrawer;
```

Change the following lines:

```cpp
// Change this:
UFUNCTION()
void Interact();

// To this:
UFUNCTION()
virtual void Interact();
```

**InteractiveActor.cpp**

Remove anything about Desk and DeskDrawer from the constructor:

```cpp
AInteractiveActor::AInteractiveActor()
{
 	// Set this actor to call Tick() every frame. You can turn this off to improve performance if you don't need it.
	PrimaryActorTick.bCanEverTick = true;

	// Create the Root and set it as the RootComponent.
	Root = CreateDefaultSubobject<USceneComponent>(TEXT("Root"));
	SetRootComponent(Root);

	// Create the BoxComponent and set it to be a collision trigger and then
	// attach it to the RootComponent.
	BoxCollider = CreateDefaultSubobject<UBoxComponent>(TEXT("BoxCollider"));
	BoxCollider->SetGenerateOverlapEvents(true);
	BoxCollider->SetCollisionProfileName(TEXT("Trigger"));
	BoxCollider->SetRelativeLocation(FVector(0.f, 0.f, 20.f));
	BoxCollider->SetBoxExtent(FVector(150.f, 100.f, 80.f));
	BoxCollider->SetupAttachment(Root);

	// Create the TextRenderComponent and add a generic "Press E to Interact"
	// message and set it to be invisible so the PlayerCharacter can't see it
	// and lastly attach it to the RootComponent.
	NoticeText = CreateDefaultSubobject<UTextRenderComponent>(TEXT("NoticeText"));
	NoticeText->SetRelativeLocation(FVector(0.f, 90.f, 80.f));
	NoticeText->SetText(FText::FromString("Press E to Interact"));
	NoticeText->SetTextRenderColor(FColor::Blue);
	NoticeText->SetVisibility(false);
	NoticeText->SetupAttachment(Root);
}
```

Remove any items added to the array in `BeginPlay`:

```cpp
// Remove any items being added to the array in `BeginPlay` so it looks like this.
void AInteractiveActor::BeginPlay()
{
	Super::BeginPlay();
	
	// Set the methods that are used to respond to when the player enters or
	// leaves the BoxCollider's trigger area.
	BoxCollider->OnComponentBeginOverlap.AddDynamic(this, &AInteractiveActor::OnComponentEnterInteractionArea);
	BoxCollider->OnComponentEndOverlap.AddDynamic(this, &AInteractiveActor::OnComponentLeaveInteractionArea);
}
```

Remove everything in `Interact`:

```cpp

// Modify this method to remove everything.
void AInteractiveActor::Interact()
{
}
```

By making the `Interact` method virtual we can override it in the next script we create.

Now go back to Unreal and right click the `InteractiveActor` script and choose "Create C++ Class Derived from InteractiveActor" and name it "InteractiveActor_Desk".

In the header file for this we're going to add the Desk and DeskDrawer mesh definitions and also the `BeginPlay` and `Interact` overrides so we can add the Drawer to the `InteractiveObjects` array and then respond to what happens when it's interacted with.

**InteractiveActor_Desk.h**

```cpp
#pragma once

#include "CoreMinimal.h"
#include "InteractiveActor.h"
#include "InteractiveActor_Desk.generated.h"

/**
 * Creates an interactive desk with a drawer.
 */
UCLASS()
class INTERACTIVEOBJECTS_API AInteractiveActor_Desk : public AInteractiveActor
{
	GENERATED_BODY()
	
public:
	// Sets up the default values.
	AInteractiveActor_Desk();

	// A non-interactive desk.
	UPROPERTY(VisibleAnywhere, BlueprintReadWrite)
	UStaticMeshComponent* Desk;

	// An interactive drawer in the desk that the PlayerCharacter can interact with.
	UPROPERTY(VisibleAnywhere, BlueprintReadWrite)
	UStaticMeshComponent* DeskDrawer;

protected:
	// Called when the game starts or when spawned.
	virtual void BeginPlay() override;

public:
	// Called when the PlayerCharacter interacts with an object in this Actor.
	virtual void Interact() override;
};
```

The above should look familiar as it's mostly what we had in the `InteractiveActor` base script and this is just specialized for the desk.

**InteractiveActor_Desk.cpp**

```cpp
#include "InteractiveActor_Desk.h"

/**
 * Sets default values.
 */
AInteractiveActor_Desk::AInteractiveActor_Desk()
{
	// Load the meshes used for the Desk and Drawer.
	static ConstructorHelpers::FObjectFinder<UStaticMesh>DeskMeshAsset(TEXT("StaticMesh'/Game/Models/Furniture/Desk/desk_desk.desk_desk'"));
	static ConstructorHelpers::FObjectFinder<UStaticMesh>DeskDrawerMeshAsset(TEXT("StaticMesh'/Game/Models/Furniture/Desk/desk_drawer.desk_drawer'"));

	// Create the component for the Desk, set its mesh and position and then
	// attach it to the Root.
	Desk = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("Desk"));
	Desk->SetRelativeLocation(FVector(0.f, 110.f, -40.f));
	Desk->SetRelativeRotation(FRotator(0.f, 90.f, 0.f));
	Desk->SetRelativeScale3D(FVector(2.f, 2.f, 2.f));
	Desk->SetStaticMesh(DeskMeshAsset.Object);
	Desk->SetupAttachment(Root);

	// Create the component for the Drawer, set its mesh and position and
	// attach it to the Desk.
	DeskDrawer = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("DeskDrawer"));
	DeskDrawer->SetStaticMesh(DeskDrawerMeshAsset.Object);
	DeskDrawer->SetupAttachment(Desk);
}

/**
 * Called when the game starts or when spawned.
 */
void AInteractiveActor_Desk::BeginPlay()
{
	Super::BeginPlay();

	// Add the DeskDrawer to the `InteractiveObjects` array.
	InteractiveObjects.Add(DeskDrawer);
}

/**
 * When this Actor is interacted with we check to see what object it is and
 * perform the interaction for that object.
 */
void AInteractiveActor_Desk::Interact()
{
	Super::Interact();

	if (ObjectCurrentlyBeingLookedAt == nullptr) return;

	// Otherwise if you have multiple interactive objects you can check their name
	// and perform a different action for each one.
	FString InteractiveComponentName = ObjectCurrentlyBeingLookedAt->GetName();

	if (InteractiveComponentName == FString("DeskDrawer"))
	{
		// If the PlayerCharacter is interacting with the desk drawer then we want to
		// move the desk drawer to that it looks like it was opened.
		FVector CurrentLocation = ObjectCurrentlyBeingLookedAt->GetRelativeLocation();
		ObjectCurrentlyBeingLookedAt->SetRelativeLocation(FVector(CurrentLocation.X, -20.0f, CurrentLocation.Z));
	}
}
```

This should also look familiar, we just moved the Desk and Drawer mesh stuff from `InteractiveActor` to here. In the `BeginPlay` we we add the DeskDrawer to the `InteractiveObjects` array like we did in the other script. The contents of `Interact` are also the same as before but moved here.

If you compile and drag out an instance of this script onto the scene and hit play it'll behave the same as before but now you can create as many InteractiveActors as you wish and they can all behave differently.

You can also override the `OnComponentLookedAt` and `OnComponentLookedAwayFrom` if you would like to have different behaviors for those.

You can also choose to create Blueprints off the base class or even add delegates to know when the PlayerCharacter is looking at or away from the interactive items.

## **Conclusion**

Now that you have a working interactive object sample try to expand on it maybe by adding delegates or creating Blueprints based off of the InteractiveActor script. Don't forget to check out the [repo](https://github.com/robertcorponoi/unreal-cpp-an-in-depth-guide-to-creating-interactive-actors) at any point if you get lost or need to see a working example at any time.
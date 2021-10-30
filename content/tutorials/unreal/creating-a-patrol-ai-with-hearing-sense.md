---
title: Creating a Patrol AI With Hearing Sense
slug: unreal-creating-a-patrol-ai-with-hearing-sense
date: "2020-08-06"
description: Learn how to create a patrol AI that responds to sound
tags: ["unreal", "game-development"]
---

So as a warning this tutorial is going to be lengthy but in depth. There will be a table of contents after this so if you want to skip the setup or skip to a certain section then you are more than welcome to do so. We will cover setting up a patrolling AI character with waypoints and then we'll get into detecting the player.

Also make sure to check out the [repo](https://github.com/robertcorponoi/unreal-cpp-patrol-ai-with-hearing) for everything that was talked about in this tutorial plus more.

Also also note that while all of the scripts will call `Tick` to make them consistent, we are going to do all this without writing any code in `Tick` so you can feel free to disable this in some components using `PrimaryActorTick.bCanEverTick = false;` in whatever script you want to disable it in.

Last note will be that some of the assets are set up as C++ scripts but later we create Blueprints off of them. These assets (PlayerCharacter, PatrolCharacter, etc) have Blueprints just for the sake of the tutorial (easier to position the mesh, etc) but they can easily be ditched and converted to C++ as the Blueprints are maily used for positioning components and more easily adjusting test variable values.

## **Getting Started**

To get started, let's see what we're going to need:

- **Player Character** - The PlayerCharacter is going to be the main player and what the PatrolCharacter is going to interact with. We won't really cover the PlayerCharacter in here because it's just some basic moving and crouching which you can find in other tutorials but if you want to copy what I'm using then you're more than welcome to do so from the [repo](https://github.com/robertcorponoi/unreal-cpp-patrol-ai-with-hearing).

- **Waypoint** - Waypoints are going to be basic Actors that are going to be used as triggers to tell the PatrolCharacter where the patrol zones are.

- **Patrol Character** - The PatrolCharacter is going to hold variables for different movement speeds and is going to keep track of the Waypoints it needs to patrol.

- **Patrol AI Controller** - This is going to be the PatrolCharacter's AIController and is going to define how the PatrolCharacter responds to the PlayerCharacter through a hearing sense.

## **Player Character**

As we talked about in the [Getting Started](#getting-started) section, the PlayerCharacter is really just a basic Character instance with some movement methods defined. Feel free to check out the one used in this tutorial in the [repo](https://github.com/robertcorponoi/unreal-cpp-patrol-ai-with-hearing).

## **Waypoints**

Let's start this off by creating the Waypoints that the PatrolCharacter will patrol between. Before we get into the code, let's see what we need the Waypoints to do:

- We need to give the Waypoint a `UBoxComponent` so that we can create a trigger for when the PatrolCharacter reaches the Waypoint.

That's about it for Waypoints. As mentioned before the Waypoints are just for the trigger so go ahead and create a new C++ script with a base parent of `Actor` and name it `Waypoint`.

**Waypoint.h**

```cpp
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "Waypoint.generated.h"

class APatrolCharacter;

/**
 * Waypoints define the areas that PatrolCharacters patrol and they also update
 * the next waypoint for the PatrolCharacter to go to once the PatrolCharacter
 * has reached a waypoint.
 */
UCLASS()
class PATROLAITUTORIAL_API AWaypoint : public AActor
{
	GENERATED_BODY()
	
public:	
	// Sets default values for this actor's properties.
	AWaypoint();

	// The BoxComponent of this Waypoint which is used as a collision trigger to
	// know when the PatrolCharacter has entered it.
	UPROPERTY(VisibleAnywhere, BlueprintReadWrite)
	class UBoxComponent* BoxComponent;

	// Called when another component triggers this Waypoints collision and it
	// lets us handle the PatrolCharacter arriving to this Waypoint.
	UFUNCTION()
	void OnWaypointBeginOverlap(UPrimitiveComponent* OverlappedComp, AActor* OtherActor, UPrimitiveComponent* OtherComp, int32 OtherBodyIndex, bool bFromSweep, const FHitResult& SweepResult);

protected:
	// Called when the game starts or when spawned.
	virtual void BeginPlay() override;

public:	
	// Called every frame.
	virtual void Tick(float DeltaTime) override;
};
```

**Waypoint.cpp**

```cpp
#include "Waypoint.h"
#include "Components/BoxComponent.h"

/**
 * Sets the default values for the Waypoint. In our case it sets up the BoxComponent
 * and sets it to be a collision trigger.
 */
AWaypoint::AWaypoint()
{
 	// Set this actor to call Tick() every frame.  You can turn this off to improve performance if you don't need it.
	PrimaryActorTick.bCanEverTick = true;

	// Create the BoxComponent, set it to be a collision trigger, define the method
	// to call when an actor enters the collision zone, and add it to the RootComponent.
	BoxComponent = CreateDefaultSubobject<UBoxComponent>(TEXT("Box Component"));
	BoxComponent->SetGenerateOverlapEvents(true);
	BoxComponent->SetCollisionProfileName(TEXT("Trigger"));
	BoxComponent->OnComponentBeginOverlap.AddDynamic(this, &AWaypoint::OnWaypointBeginOverlap);
	BoxComponent->SetupAttachment(RootComponent);
}

/**
 * Called when the game starts or when spawned
 */
void AWaypoint::BeginPlay()
{
	Super::BeginPlay();
}

/**
 * Called every frame.
 *
 * @param DeltaTime The time between the previous Tick and the current one.
 */
void AWaypoint::Tick(float DeltaTime)
{
	Super::Tick(DeltaTime);
}

/**
 * When a component first enters the BoxCollider's collision area we try to
 * cast it to our PatrolCharacter and then set a timer so that the PatrolCharacter
 * can run its looking animation. Lastly we set the PatrolCharacter to move on to
 * the next Waypoint.
 *
 * @param OverlappedComp
 * @param OtherActor
 * @param OtherComp
 * @param OtherBodyIndex
 * @param bFromSweep
 * @param SweepResult
 */
void AWaypoint::OnWaypointBeginOverlap(UPrimitiveComponent* OverlappedComp, AActor* OtherActor, UPrimitiveComponent* OtherComp, int32 OtherBodyIndex, bool bFromSweep, const FHitResult& SweepResult)
{
	// Return if anything is null so we can avoid a potential crash.
	if ((OtherActor == nullptr) || (OtherActor == this) || (OtherComp == nullptr)) return;
}
```

As you can see all we did was add a `UBoxComponent` and make it a trigger and se the `OnWaypointBeginOverlap` so we can do something when an Actor enters the trigger area. We'll add the functionality for this after we define the PatrolCharacter.

At this point I created a Blueprint based off of this class so I could adjust the extents of the `UBoxComponent` and see it visually but you can easily do this in the constructor of the Waypoint if you wish.

![Box Extents](../../images/aug/unreal-creating-a-patrol-ai-with-hearing-sense/box-extents.png)

Make sure this compiles and then let's move on to the PatrolCharacter.

## **Patrol Character**

Now we need to create the PatrolCharacter. It's going to be fairly simple as movement is going to be handled by the AIController but the PatrolCharacter does need to have a mini state machine.

Again, before we get into the code, let's see what we need the PatrolCharacter to do:

- We need to be able to switch between two states: Patrol and Chase.

- We need to hold a reference to the array of Waypoints that this PatrolCharacter needs to patrol.

- We want some variables that hold some customizable properties like walk speeds, delays, etc.

Let's create a new C++ script that has a base parent of Character and name it PatrolCharacter.

**PatrolCharacter.h**

```cpp
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "PatrolCharacter.generated.h"

class AWaypoint;

/**
 * The modes that the PatrolCharacter can be in. 
 * PATROL - The PatrolCharacter is patrolling between Waypoints.
 * CHASE - The PatrolCharacter is chasing the PlayerCharacter.
 */
UENUM(BlueprintType)
enum class PatrolMode : uint8
{
	PATROL UMETA(DisplayName = "PATROL"),
	CHASE UMETA(DisplayName = "CHASE")
};

/**
 * A Character that patrols around a set of Waypoints and keeps
 * an eye out for the PlayerCharacter.
 */
UCLASS()
class PATROLAITUTORIAL_API APatrolCharacter : public ACharacter
{
	GENERATED_BODY()

public:
	// Sets default values for this character's properties.
	APatrolCharacter();

	// We start the game assuming we can't see the player and so we
	// are in Patrol mode.
	UPROPERTY(VisibleAnywhere, BlueprintReadWrite)
	PatrolMode Mode = PatrolMode::PATROL;

	// The speed at which the PatrolCharacter walks between Waypoints.
	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	float PatrolSpeed = 100.0f;

	// The speed at which the PatrolCharacter chases the PlayerCharacter.
	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	float ChaseSpeed = 500.0f;

	// The Waypoints that the should be patrolled.
	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	TArray<AWaypoint*> Waypoints;

	// The index of the Waypoint in `Waypoints` to go towards.
	UPROPERTY(VisibleAnywhere, BlueprintReadWrite)
	int32 CurrentWaypointIndex = 0;

	// The distance away the PatrolCharacter can be from the Waypoint before 
	// it registers the PatrolCharacter as being arrived at the Waypoint.
	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	float DistanceBeforeArrivedAtWaypoint = 5.0f;

	// The amount of time, in seconds, that the PatrolCharacter should wait
	// at a Waypoint before moving on to the next one.
	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	float WaypointDelay = 5.0f;

	// The distance away the PatrolCharacter can be from the PlayerCharacter
	// before it stops chasing.
	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	float DistanceBeforeArrivedAtPlayer = 100.0f;

	// Indicates whether this PatrolCharacter is currently at a Waypoint or
	// not. This is used by the animation Blueprint to decide if the Looking
	// or Walking animation should be played.
	UPROPERTY(VisibleAnywhere, BlueprintReadWrite)
	bool bIsAtWaypoint = false;

protected:
	// Called when the game starts or when spawned.
	virtual void BeginPlay() override;

public:	
	// Called every frame.
	virtual void Tick(float DeltaTime) override;

	// Called to bind functionality to input.
	virtual void SetupPlayerInputComponent(class UInputComponent* PlayerInputComponent) override;

	// Called to change the PatrolCharacter's settings to patrol mode.
	void SetPatrolMode();

	// Called to change the PatrolCharacter's settings to chase mode.
	void SetChaseMode();
};
```

**PatrolCharacter.cpp**

```cpp
#include "PatrolCharacter.h"
#include "GameFramework/CharacterMovementComponent.h"

/**
 * Sets the default values for the PatrolCharacter. In our case we don't do much
 * here except set up rotation and orientation so that the PatrolCharacter faces
 * the direction they're walking.
 */
APatrolCharacter::APatrolCharacter()
{
 	// Set this character to call Tick() every frame.  You can turn this off to improve performance if you don't need it.
	PrimaryActorTick.bCanEverTick = true;

	// Helps orient the PatrolCharacter so that when it walks it doesn't face the
	// Waypoint but instead the direction that it's walking.
	bUseControllerRotationPitch = false;
	bUseControllerRotationYaw = false;
	bUseControllerRotationRoll = false;
	GetCharacterMovement()->bOrientRotationToMovement = true;

	// Set the default rotation rate and the max walking speed.
	GetCharacterMovement()->RotationRate = FRotator(0.0f, 200.0f, 0.0f);
	SetPatrolMode();
}

/**
 * Called when the game starts or when spawned
 */
void APatrolCharacter::BeginPlay()
{
	Super::BeginPlay();
}

/**
 * Called every frame.
 *
 * @param DeltaTime The time between the previous Tick and the current one.
 */
void APatrolCharacter::Tick(float DeltaTime)
{
	Super::Tick(DeltaTime);
}

/**
 * Called to bind functionality to input.
 *
 * @param PlayerInputComponent An Actor component that enables us to bind axis events and action inputs to methods.
 */
void APatrolCharacter::SetupPlayerInputComponent(UInputComponent* PlayerInputComponent)
{
	Super::SetupPlayerInputComponent(PlayerInputComponent);
}

/**
 * Used by the `PatrolAIController` to set the properties of the PatrolCharacter to
 * the values they should be when the PatrolCharacter is patrolling Waypoints.
 */
void APatrolCharacter::SetPatrolMode()
{
	GetCharacterMovement()->MaxWalkSpeed = PatrolSpeed;
	Mode = PatrolMode::PATROL;
}

/**
 * Used by the `PatrolAIController` to set the properties of the PatrolCharacter to
 * the values they should be when the PatrolCharacter is chasing the PlayerCharacter.
 */
void APatrolCharacter::SetChaseMode()
{
	// Set this to false so that the looking animation doesn't play while chasing
	// the PlayerCharacter.
	bIsAtWaypoint = false;

	if (GetCharacterMovement() == nullptr) return;
	GetCharacterMovement()->MaxWalkSpeed = ChaseSpeed;
	Mode = PatrolMode::CHASE;
}
```

So the code is mostly self-documenting but let's look into it a bit. In the header we:

- Create an enum for our mini state machine with our two states: Patrol and Chase.

- We need have a variable that lets us keep track of our current mode.

- Below that we have a couple variables that define the speed that the PatrolCharacter should walk at in each mode.

- Then we define an array of Waypoints that holds the Waypoints that should be patrolled between. Below that we have a variable that keeps track of what Waypoint in the array that we are currently moving towards.

- Below those are some variables that let you define how far away you can be from the Waypoint or PlayerCharacter before the AIController says that the move is complete. This let's you get closer or further to the PlayerCharacter or Waypoint depending on the values you provide.

- The two functions we have at the bottom let us switch between the two modes available.

In the cpp file we:

- Set the controller rotation values to false so that the PatrolCharacter faces the direction they're going. Otherwise it would always face the direction of the Waypoint which is weird.

- We also have the functions that switch between modes. You're free to add anything else you want to these methods to differentiate how the PatrolCharacter acts in each mode but make sure that you leave the last line in each since that switches the `Mode` variable.

At this point I created a Blueprint based off of this class so I could visually set the mesh and later the Waypoints. Again this is just for convenience and you can easily hardcode it all.

Save and compile and lets move on to the AIController.

## **Back to Waypoints**

Actually now that we've defined the PatrolCharacter, we can finish up the Waypoint script.

In our cpp script we need to add the following includes:

```cpp
#include "PatrolCharacter.h"
```

and then in the `OnWaypointBeginOverlap` we need to see if the Actor that triggered this is a PatrolCharacter and if it is then we set the PatrolCharacter's  `bIsAtWaypoint` variable to `true`.

```cpp
void AWaypoint::OnWaypointBeginOverlap(UPrimitiveComponent* OverlappedComp, AActor* OtherActor, UPrimitiveComponent* OtherComp, int32 OtherBodyIndex, bool bFromSweep, const FHitResult& SweepResult)
{
	// Return if anything is null so we can avoid a potential crash.
	if ((OtherActor == nullptr) || (OtherActor == this) || (OtherComp == nullptr)) return;

	// Try to cast the `OtherActor` to our PatrolCharacter because we only
	// want to work with the PatrolCharacter.
	APatrolCharacter* PatrolCharacter = Cast<APatrolCharacter>(OtherActor);
	if (PatrolCharacter == nullptr) return;

	// Set the PatrolCharacter to be at the Waypoint so that it can play its looking around animation and then
	// call the `AfterWaypointTimer` method when the timer is finished.
	PatrolCharacter->bIsAtWaypoint = true;
}
```

Ok now save and compile this and now lets actually get into the AIController.

## **Patrol AI Controller**

Now it's time for the fun part, making the AIController that'll respond to hearing the player.

Before we get into the code lets see what the AIController with hearing sense is going to need to be able to do:

- Define a radius and max age for the hearing sense. This relates to how far away the PatrolCharacter can hear sounds and after a sound is heard how long until the PatrolCharacter forgets about it.

- Always move the PatrolCharacter to the next Waypoint unless the PlayerCharacter is detected and in that case we move towards the PlayerCharacter for as long as we can hear them.

This is a pretty big simplification of it but let's get into the code as it's easier when you see it. Create a new C++ script with a base parent of `AIController` named PatrolAIController and lets get into it.

**PatrolAIController.h**

```cpp
#pragma once

#include "CoreMinimal.h"
#include "AIController.h"
#include "Perception/AIPerceptionTypes.h"
#include "PatrolAIController.generated.h"

/**
 * Configures the senses of the PatrolCharacter and responds to sensing the PlayerCharacter
 * set as the target in the PatrolCharacter instance.
 */
UCLASS()
class PATROLAITUTORIAL_API APatrolAIController : public AAIController
{
	GENERATED_BODY()

public:
	// Sets default values for this AI Controller's properties.
	APatrolAIController();

	// Called when the game starts or when spawned.
	virtual void BeginPlay() override;

	// Called when the AIController is taken over.
	virtual void OnPossess(APawn* Pawn) override;

	// Called every frame.
	virtual void Tick(float DeltaSeconds) override;

	// Called to get the control's rotation.
	virtual FRotator GetControlRotation() const override;

	// Called when a move request has been completed. This can be
	// a move request to a Waypoint or to the PlayerCharacter.
	virtual void OnMoveCompleted(FAIRequestID RequestID, const FPathFollowingResult& Result) override;

	// Gets called when the perception component updates. This is
	// where check to see if the PlayerCharacter was detected.
	UFUNCTION()
	void OnPawnDetected(const TArray<AActor*>& DetectedPawns);

	// Moves the PatrolCharacter to the next Waypoint.
	UFUNCTION()
	void MoveToWaypoint();

	// The TimerHandle used to delay the setting of the waypoint giving the
	// PatrolCharacter time to perform a looking animation.
	UPROPERTY()
	FTimerHandle TimerHandle;

	// The position to move to. This can be different than the PlayerCharacter's
	// position if a distraction was used.
	UPROPERTY(VisibleAnywhere, BlueprintReadWrite)
	FVector PositionToMoveTo;

	UPROPERTY(VisibleAnywhere, BlueprintReadWrite)
	class APatrolCharacter* PatrolCharacter;

	// A reference to the hearing perception component.
	UPROPERTY(VisibleAnywhere, BlueprintReadWrite, Category = AI)
	class UAISenseConfig_Hearing* HearingConfig;

	// The range at which the PatrolCharacter can hear the PlayerCharacter.
	UPROPERTY(VisibleAnywhere, BlueprintReadWrite, Category = AI)
	float AIHearingRange = 1000.0f;

	// The amount of time after the PlayerCharacter has been heard that the
	// PatrolCharacter will forget they heard the PlayerCharacter.
	UPROPERTY(VisibleAnywhere, BlueprintReadWrite, Category = AI)
	float AIHearingMaxAge = 5.0f;

	// Indicates whether the PatrolCharacter will be able to listen at the
	// start of the game or whether it will be enabled later manually.
	UPROPERTY(VisibleAnywhere, BlueprintReadWrite, Category = AI)
	bool bAIHearingStartsEnabled = true;

	// Indicates whether the PatrolCharacter has seen the PlayerCharacter or not.
	UPROPERTY(VisibleAnywhere, BlueprintReadWrite, Category = AI)
	bool bIsPlayerDetected = false;

	// If the PatrolCharacter has seen the PlayerCharacter then this is populated with how
	// far away the PlayerCharacter is from the PatrolCharacter.
	UPROPERTY(VisibleAnywhere, BlueprintReadWrite, Category = AI)
	float DistanceToPlayer = 0.0f;
};
```

Let's go over this before we get into the cpp file:

- We have to add the `#include "Perception/AIPerceptionTypes.h"` as it's a struct and we can't forward declare that like we can with classes.

- We override the virtual methods provided with the `AIController` with the most important one being `OnPawnDetected` which will let us know when the PlayerCharacter has been sensed.

- We have a `FTimerHandle` because we're going to need to set a timer in between Waypoints to give the PatrolCharacter time to "look around". In the [repo](https://github.com/robertcorponoi/unreal-cpp-patrol-ai-with-hearing) you can see that this is where I play the "Looking Around" animation for the PatrolCharacter.

- We need a reference to the PatrolCharacter so we can easily issue commands.

- We set up the `UAISenseConfig_Hearing` and it's default settings, the range and age which we talked about previously.

- We have a few helper variables such as `PositionToMoveTo` and `bIsPlayerDetected`.

Ok hopefully that's a bit more clear so let's move on to the cpp file:

```cpp
#include "PatrolAIController.h"
#include "Waypoint.h"
#include "PatrolCharacter.h"
#include "PlayerCharacter.h"
#include "Tasks/AITask_MoveTo.h"
#include "Kismet/GameplayStatics.h"
#include "Kismet/KismetMathLibrary.h"
#include "Perception/AISenseConfig_Hearing.h"
#include "Perception/AIPerceptionComponent.h"
#include "Navigation/PathFollowingComponent.h"

/**
 * Sets the default values for the PatrolAIController. In our case we create the necessary
 * perception components and setup the dominant sense.
 */
APatrolAIController::APatrolAIController()
{
	// We need this AIController to run its Tick method.
	PrimaryActorTick.bCanEverTick = true;

	// Create the hearing sense, and a AIPerceptionComponent and 
	// set it as the default perception component of the AIController.
	HearingConfig = CreateDefaultSubobject<UAISenseConfig_Hearing>(TEXT("Hearing Config"));
	SetPerceptionComponent(*CreateDefaultSubobject<UAIPerceptionComponent>(TEXT("Perception Component")));

	HearingConfig->HearingRange = AIHearingRange;
	HearingConfig->LoSHearingRange = AIHearingRange;
	HearingConfig->SetMaxAge(AIHearingMaxAge);

	// Set the hearing sense to detect everything. This should be changed to fit your needs
	// but it makes it easiest for the tutorial.
	HearingConfig->DetectionByAffiliation.bDetectEnemies = true;
	HearingConfig->DetectionByAffiliation.bDetectFriendlies = true;
	HearingConfig->DetectionByAffiliation.bDetectNeutrals = true;

	// Set hearing as the dominant sense.
	GetPerceptionComponent()->SetDominantSense(*HearingConfig->GetSenseImplementation());
	GetPerceptionComponent()->ConfigureSense(*HearingConfig);
}

/**
 * Called when the game starts or when spawned
 */
void APatrolAIController::BeginPlay()
{
	Super::BeginPlay();

	// Set the method to respond when the perception component updates.
	GetPerceptionComponent()->OnPerceptionUpdated.AddDynamic(this, &APatrolAIController::OnPawnDetected);

	// Set the reference to the PatrolCharacter.
	PatrolCharacter = Cast<APatrolCharacter>(GetPawn());

	// Set the Waypoint index to the last Waypoint because the `MoveToWaypoint` method
	// of the PatrolAIController will increment by 1 on the first update so by setting
	// it to the last index we end up at the first.
	PatrolCharacter->CurrentWaypointIndex = PatrolCharacter->Waypoints.Num() - 1;

	// Tell the PatrolCharacter to start moving to a Waypoint.
	MoveToWaypoint();
}

/**
 * Called when the AIController is taken over.
 *
 * @param PatrolPawn The pawn that was taken over.
 */
void APatrolAIController::OnPossess(APawn* PatrolPawn)
{
	Super::OnPossess(PatrolPawn);
}

/**
 * Called every frame.
 *
 * @param DeltaTime The time between the previous Tick and the current one.
 */
void APatrolAIController::Tick(float DeltaSeconds)
{
	Super::Tick(DeltaSeconds);
}

/**
 * Returns a zero rotator if GetPawn is null and the Actor rotation yaw
 * otherwise.
 */
FRotator APatrolAIController::GetControlRotation() const
{
	if (GetPawn() == nullptr) return FRotator(0.0f, 0.0f, 0.0f);

	return FRotator(0.0f, GetPawn()->GetActorRotation().Yaw, 0.0f);
}

/**
 * When the PatrolCharacter's perception detects a Pawn we check to see if
 * it is the PlayerCharacter and update the `bIsPlayerDetected` variable accordingly.
 *
 * @param DetectedPawns - The Pawns that the AIController has detected in its radius.
 */
void APatrolAIController::OnPawnDetected(const TArray<AActor*>& DetectedPawns)
{
	// Since `DetectedPawns` is an array of pawns that have been detected we
	// need to loop through and see if any of those are our PlayerController.
	for (AActor* DetectedPawn : DetectedPawns)
	{
		// Get the data from the latest hearing sensed.
		// FAISenseID HearingSenseID = UAISense::GetSenseID<UAISense_Hearing>();
		if (!HearingConfig->GetSenseID().IsValid()) return;
		const FActorPerceptionInfo* HeardPerceptionInfo = GetPerceptionComponent()->GetFreshestTrace(HearingConfig->GetSenseID());

		// If the sense isn't active anymore then we return early. This happens when
		// the max age is hit for a heard event.
		if (!HeardPerceptionInfo->IsSenseActive(HearingConfig->GetSenseID()))
		{
			// The hearing sense has been lost so we return the PatrolCharacter back
			// to patrolling Waypoints.
			MoveToWaypoint();
			return;
		}

		// Attempt to cast the current Pawn to our PlayerCharacter and return early
		// if it's not since we only care about the PlayerCharacter.
		APlayerCharacter* PlayerCharacter = Cast<APlayerCharacter>(DetectedPawn);
		if (PlayerCharacter == nullptr) return;
		
		// At this point we can safely assume that the PlayerCharacter has been detected
		// and we can get the distance away they are from the PatrolCharacter.
		bIsPlayerDetected = true;
		DistanceToPlayer = GetPawn()->GetDistanceTo(PlayerCharacter);

		// Instead of just moving towards the PlayerCharacter we want to get the position that
		// the hearing event happened at. This is helpful if you're implementing a distraction
		// hearing event and don't want to create another Actor just for a distraction.
		PositionToMoveTo = HeardPerceptionInfo->GetStimulusLocation(HearingConfig->GetSenseID());

		PatrolCharacter->SetChaseMode();

		// Finally we move to the location found above. If the location keeps moving, like if
		// the sound is the PlayerCharacter's footsteps, then this will keep moving to the new
		// location.
		MoveToLocation(PositionToMoveTo, PatrolCharacter->DistanceBeforeArrivedAtPlayer);

		// DEBUG
		if (GEngine)
		{
			GEngine->AddOnScreenDebugMessage(-1, 10.0, FColor::Green, FString::Printf(TEXT("Investigating Sound At Location: %s For %f seconds"), *PositionToMoveTo.ToString(), AIHearingMaxAge));
		}
	}
}

/**
 * When a `MoveToLocation` or `MoveToActor` action has completed this method is fired
 * and we either move to another Waypoint or we chase the PlayerCharacter.
 *
 * @param RequestID The Move Request ID for the move that was completed.
 * @param Result
 */
void APatrolAIController::OnMoveCompleted(FAIRequestID RequestID, const FPathFollowingResult& Result)
{
	Super::OnMoveCompleted(RequestID, Result);
	
	if (PatrolCharacter->Mode == PatrolMode::PATROL)
	{
		// DEBUG
		if (GEngine)
		{
			GEngine->AddOnScreenDebugMessage(-1, 10.0, FColor::Green, FString::Printf(TEXT("Patrol At Waypoint: %s For %f seconds"), *GetNameSafe(PatrolCharacter->Waypoints[PatrolCharacter->CurrentWaypointIndex]), PatrolCharacter->WaypointDelay));
		}

		// The PatrolCharacter is in Patrol mode so we wait at the current Waypoint
		// for 5 seconds and then we call `MoveToWaypoint` to move to the next Waypoint.
		GetWorld()->GetTimerManager().SetTimer(TimerHandle, this, &APatrolAIController::MoveToWaypoint, PatrolCharacter->WaypointDelay);
	}
}

/**
 * Moves the PatrolCharacter to the next Waypoint on its list.
 */
void APatrolAIController::MoveToWaypoint()
{
	// Check to see if the PatrolCharacter was in a chase previous to this being
	// called. If they were then change back to patrol mode and we don't increment
	// the Waypoint index because chances are they didn't make it to the Waypoint
	// before being interrupted so we don't want them to skip a Waypoint.
	//
	// If they were not in a chase then we increment the Waypoint index so they can
	// go to the next Waypoint.
	if (PatrolCharacter->Mode == PatrolMode::CHASE) 
	{
		// Since the PatrolCharacter was previously chasing the PlayerCharacter we
		// can assume that they didn't make it to their Waypoint. To compensate for
		// this we set the Waypoint index back by 1.
		PatrolCharacter->SetPatrolMode();
	}
	else
	{
		if (PatrolCharacter->CurrentWaypointIndex == PatrolCharacter->Waypoints.Num() - 1)
		{
			// The PatrolCharacter is at the last Waypoint in the Waypoints array so we send
			// them back to the first Waypoint.
			PatrolCharacter->CurrentWaypointIndex = 0;
		}
		else
		{
			// There's still more Waypoints the PatrolCharacter hasn't patrolled yet so we
			// send the PatrolCharacter to the next Waypoint in the Waypoints array.
			PatrolCharacter->CurrentWaypointIndex++;
		}
	}

	// The Waypoint exists, the PatrolCharacter is not currently waiting at a Waypoint,
	// and the PlayerCharacter has not been detected so we move towards a Waypoint.
	MoveToActor(PatrolCharacter->Waypoints[PatrolCharacter->CurrentWaypointIndex], PatrolCharacter->DistanceBeforeArrivedAtWaypoint);

	// DEBUG
	if (GEngine)
	{
		GEngine->AddOnScreenDebugMessage(-1, 10.0, FColor::Green, FString::Printf(TEXT("Patrol moving To Waypoint: %s"), *GetNameSafe(PatrolCharacter->Waypoints[PatrolCharacter->CurrentWaypointIndex]), PatrolCharacter->CurrentWaypointIndex));
	}

	PatrolCharacter->bIsAtWaypoint = false;
}
```

Ok that was quite a lot so lets break it down:

- In the constructor we create the hearsing sense, set it's settings from the `AIHearingRange` and `AIHearingMaxAge` variables and then set it so that it'll detect everyone. Lastly we set it as the dominant sense for the `AIController`.

- In `BeginPlay`, we set the method that responds to `OnPerceptionUpdated` which is our `OnPawnDetected` method. We then get the reference to the PatrolCharacter that the `AIController` is attached to and set the Waypoint index to the last Waypoint. We do this because when we call `MoveToWaypoint` right below it, it increments the Waypoint index by 1 and by default it would have the PatrolCharacter walk to the second Waypoint first. This way when it increments the Waypoint index it will go to the first Waypoint first.

- In `OnPawnDetected` is where all the magic happens. Since `DetectedPawns` is an array we need to loop through each element and get the hearing info. There's also a chance that the sense is inactive which means that the PlayerCharacter is no longer detected or the heard sound has reached its max age and expired. In this case we assume that the PatrolCharacter can no longer hear the PlayerCharacter and so we call `MoveToWaypoint` to make them patrol again. Otherwise if the sense is active we cast the detected pawn into our PlayerCharacter and set the PatrolCharacter to chase after the PlayerCharacter by continuously moving to the PlayerCharacter's latest noise location.

- The `OnMoveCompleted` method gets called every time a move command has finished. This means anytime that the PatrolCharacter has reached a Waypoint or has reached the location of the noise this method will be called. We don't really care about when the PatrolCharacter has reached the Player as that's always handled by `OnPawnDetected` but we do care about patrolling. If the PatrolCharacter has just finished moving to a Waypoint, which in the code we know by whether or not they're in Patrol mode, then we set a timer with a delay so that the PatrolCharacter can "Look Around". In the [repo](https://github.com/robertcorponoi/unreal-cpp-patrol-ai-with-hearing) I use this time to perform a "Looking Around" animation.

Next I created a Blueprint based off of this class so that I could easily mess around with the hearing radius and max age values which again you don't have to do but what you do have to do is assign this `AIController` to your PatrolCharacter.

So in the PatrolCharacter Blueprint (or script) you have to change the Pawn settings so that:

- **Auto Possess AI** - Placed in World or Spawned
- **AI Controller Class** - PatrolAIController (Blueprint or script).

![Patrol Character Settings](../../images/aug/unreal-creating-a-patrol-ai-with-hearing-sense/patrol-character-settings.png)

Save and compile this and let's move on.

## **Making the Player Emit Sound**

If you attempted to set up a level now you would see that the PatrolCharacter doesn't react to the PlayerCharacter. This is because the PlayerCharacter needs a `UPawnNoiseEmitter` component to be able to make noise that the PatrolAIController can hear.

In your PlayerCharacter header file you need to add:

```cpp
// The NoiseEmitterComponent.
UPROPERTY(VisibleAnywhere, BlueprintReadWrite)
class UPawnNoiseEmitterComponent* PlayerNoiseEmitter;
```

and then in the cpp file you need to set it up in the constructor:

```cpp
// Create a NoiseEmitterComponent so that we can make noise and have the
// PatrolCharacter respond to it.
PlayerNoiseEmitter = CreateDefaultSubobject<UPawnNoiseEmitterComponent>(TEXT("Noise Emitter"));
PlayerNoiseEmitter->SetAutoActivate(true);
```

Also make sure that in the cpp file you have the includes for it:

```cpp
#include "Components/PawnNoiseEmitterComponent.h"
```

Now whenever you want to make noise, you can call:

```cpp
PlayerNoiseEmitter->MakeNoise(this, 1.0f, GetActorLocation());
```

Which will make noise at the current location. The middle parameter, `1.0f`, is used to determine the loudness of the noise and can be a value between 0.0 and 1.0. For a reference of how loudness works if your `AIHearingRadius` is set to `1000.0f` and you make a noise with a loudness of `0.5f` then the PatrolCharacter will only hear if you're within a `500.0f` radius.

For the demo I would set the above to happen when an action key is pressed so you can observe the PatrolCharacter walking to a spot where you made noise at. Afterwards you can include it in your character's walking to simulate the PatrolCharacter hearing footsteps.

## **Testing The Hearing Sense**

Go ahead and make a decently sized scene and drag out like 3 or 4 Waypoints onto the level. Make sure that the box extends of these Waypoints is a decent size that can capture the PatrolCharacter. Then drag out your PatrolCharacter and in the details assign these Waypoints in any order to the Waypoints array. Also make sure that your PlayerCharacter is set as the default pawn so it'll spawn when the game starts and make sure they're not near the enemy so that you can observe the enemy patrolling to the Waypoint. Lastly make sure that your level has a nav mesh so that the PatrolCharacter can actually walk around.

If you set it up correctly and play then you'll notice the PatrolCharacter moving towards the Waypoints one by one and if you go near the PatrolCharacter and make a noise then they'll immediately stop patrolling and go investigate the noise. Once the noise has expired (after the `AIHearingMaxAge` has been reached) then they'll go back to patrolling the Waypoint that they were on the way to before they got interrupted.

As a challenge you can try having another Actor emit a noise such as simulating a rock being thrown, just follow the same instructions as what we did with the PlayerCharacter and make noise at a specific location. You can even modify the last parameter in the make noise we used above to make the noise at another location but be aware that it's in relation to the PlayerCharacter so you'll have to add/subtract from the PlayerCharacter's location.

![Testing](../../images/aug/unreal-creating-a-patrol-ai-with-hearing-sense/testing.png)

## **Conclusion**

Hopefully that cleared up questions anyone had on how to make an AI respond to sound and more importantly respond to sound without the use of the intensive checks in the `Tick` method. Also make sure to check out the [repo](https://github.com/robertcorponoi/unreal-cpp-patrol-ai-with-hearing) for a full sample.
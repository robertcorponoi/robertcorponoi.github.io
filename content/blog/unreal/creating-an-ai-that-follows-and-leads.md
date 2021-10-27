---
title: Creating an AI that Follows & Leads
slug: unreal-creating-an-ai-that-follows-and-leads
date: "2020-08-25"
description: Learn how to create an AI that follows and leads the player
tags: ["unreal", "game-development"]
---

In this tutorial we'll look at what it takes to create an AI that follows the player and can lead the player to waypoints. This won't be too in-depth but it'll get you started with an AI system of following and leading without relying on logic placed in `Tick` leading to more fluid movement and better performance. Let's take a look at the classes we'll need to make this happen.

- **PlayerCharacter** - The PlayerCharacter is going to be a standard third-person Character that we'll expand on.

- **AllyCharacter** - The AllyCharacter is the Character that's going to follow and lead the PlayerCharacter.

- **AllyAIController** - The AllyAIController is going to be the AIController that controls when/how the AllyCharacter moves.

## **PlayerCharacter**

So as stated above the PlayerCharacter is a standard third person Character but we'll go over it quickly as it's important to be on the same page before progressing.

The PlayerCharacter has the following:

- A `USkeletalMeshComponent` so we can change the mesh of the PlayerCharacter to a default third person skeletal mesh.

- A `USpringArmComponent` and `UCameraComponent` to add a camera on a boom so we can have some decent camera controls.

- A boolean that keeps track of whether the PlayerCharacter is currently sprinting or not. This will be used by the animation blueprint and the AllyCharacter.

- Methods to respond to axis inputs for moving forward, backward, left and right.

- Methods to respond to the sprint button being pressed and released.

Below is the PlayerCharacter header file where the components and methods talked about above are defined:

**PlayerCharacter.h**

```cpp
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "PlayerCharacter.generated.h"

/**
 * PlayerCharacter is the main Character of the game controlled by the player.
 */
UCLASS(config = Game)
class FOLLOWLEADAI_API APlayerCharacter : public ACharacter
{
	GENERATED_BODY()

public:
	// Sets default values for this character's properties.
	APlayerCharacter();

	// The PlayerCharacter's skeletal mesh.
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = Mesh)
	class USkeletalMeshComponent* PlayerSkeletalMesh;

	// The PlayerCharacter's camera.
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = Camera)
	class UCameraComponent* PlayerCamera;

	// The boom for the PlayerCharacter's camera.
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = Camera)
	class USpringArmComponent* PlayerCameraSpringArm;

	// Indicates whether the PlayerCharacter is sprinting or not.
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = Animation)
	bool bIsSprinting = false;

protected:
	// The speed at which the PlayerCharacter should walk at.
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = Movement)
	float WalkSpeed = 200.f;

	// The speed at which the PlayerCharacter should sprint at.
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = Movement)
	float SprintSpeed = 500.f;

protected:
	/**
	 * Called when the PlayerCamera moves forward and backward.
     *
     * @param Value The axis value from the input.
	 */
	void MoveForwardBackward(float Value);

	/**
	 * Called when the PlayerCamera moves left and right.
	 *
	 * @param Value The axis value from the input.
	 */
	void MoveLeftRight(float Value);

	/**
	 * Called when the sprint input action button is pressed down.
	 */
	 void SprintStart();

	 /**
	  * Called when the sprint input action button is released.
	  */
	 void SprintStop();

	/**
	 * Called to bind functionality to input.
	 *
	 * @param PlayerInputComponent An Actor component for input bindings.
	 */
	virtual void SetupPlayerInputComponent(class UInputComponent* PlayerInputComponent) override;
};
```

Now in the cpp file we:

- Load the skeletal mesh and AnimBlueprint (look at the [repo](https://github.com/robertcorponoi/unreal-follow-lead-ai) or Unreal's third person character demo for an example of the animation blueprint as it's out of scope for this tutorial.

- Create the components, set their default values, and attach them where they're needed.

- Set up the methods that respond to the axis and action inputs.

- Create the methods defined the header to move the PlayerCharacter forward, backward, left, right. Also set up the methods to start and stop sprinting.

**PlayerCharacter.cpp**

```cpp
#include "PlayerCharacter.h"
#include "Camera/CameraComponent.h"
#include "Components/InputComponent.h"
#include "Components/CapsuleComponent.h"
#include "Components/SkeletalMeshComponent.h"
#include "GameFramework/Controller.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "GameFramework/SpringArmComponent.h"

/**
 * Sets the default values for the PlayerCharacter.
 */
APlayerCharacter::APlayerCharacter()
{
	// Load the resources needed for the PlayerCharacter.
	static ConstructorHelpers::FObjectFinder<USkeletalMesh>PlayerSkeletalMeshAsset(TEXT("SkeletalMesh'/Game/Mannequin/Character/Mesh/SK_Mannequin.SK_Mannequin'"));
	static ConstructorHelpers::FObjectFinder<UAnimBlueprint>PlayerAnimBlueprint(TEXT("AnimBlueprint'/Game/Mannequin/Animations/ThirdPerson_AnimBP.ThirdPerson_AnimBP'"));

	// Set the SkeletalMeshComponent to the Character's mesh and adjust its properties.
	PlayerSkeletalMesh = GetMesh();
	PlayerSkeletalMesh->SetSkeletalMesh(PlayerSkeletalMeshAsset.Object);
	PlayerSkeletalMesh->SetRelativeLocationAndRotation(FVector(0.f, 0.f, -90.f), FRotator(0.f, -90.f, 0.f));
	PlayerSkeletalMesh->SetAnimInstanceClass(PlayerAnimBlueprint.Object->GeneratedClass);

	// Create the SpringArmComponent and attach it to the RootComponent.
	PlayerCameraSpringArm = CreateDefaultSubobject<USpringArmComponent>(TEXT("PlayerCameraSpringArm"));
	PlayerCameraSpringArm->TargetArmLength = 500.f;
	PlayerCameraSpringArm->bUsePawnControlRotation = true;
	PlayerCameraSpringArm->SetupAttachment(RootComponent);

	// Create the CameraComponent and attach it to the SpringArmComponent.
	PlayerCamera = CreateDefaultSubobject<UCameraComponent>(TEXT("PlayerCamera"));
	PlayerCamera->bUsePawnControlRotation = false;
	PlayerCamera->SetupAttachment(PlayerCameraSpringArm, USpringArmComponent::SocketName);

	// Sets the capsule collider's size.
	GetCapsuleComponent()->InitCapsuleSize(40.f, 100.f);

	// Set the PlayerCharacter to not rotate when the controller rotates.
	bUseControllerRotationPitch = false;
	bUseControllerRotationYaw = false;
	bUseControllerRotationRoll = false;

	// Set the default values for the PlayerCharacter's movement.
	GetCharacterMovement()->bOrientRotationToMovement = true;
	GetCharacterMovement()->RotationRate = FRotator(0.0f, 540.0f, 0.0f);
	GetCharacterMovement()->MaxWalkSpeed = WalkSpeed;

	// Set the PlayerCharacter to be the default player of the game.
	AutoPossessPlayer = EAutoReceiveInput::Player0;
}

/**
 * Called to bind functionality to input.
 *
 * @param PlayerInputComponent An Actor component for input bindings.
 */
void APlayerCharacter::SetupPlayerInputComponent(UInputComponent* PlayerInputComponent)
{
	check(PlayerInputComponent);

	// Set up the methods to respond to the PlayerCharacter moving forward, backward,
	// left, and right.
	PlayerInputComponent->BindAxis("MoveForwardBackward", this, &APlayerCharacter::MoveForwardBackward);
	PlayerInputComponent->BindAxis("MoveLeftRight", this, &APlayerCharacter::MoveLeftRight);

	// Set the "TurnLeftRight" and "LookUpDown" axis inputs to control the yaw and pitch
	// of the camera.
	PlayerInputComponent->BindAxis("TurnLeftRight", this, &APawn::AddControllerYawInput);
	PlayerInputComponent->BindAxis("LookUpDown", this, &APawn::AddControllerPitchInput);

	// Set up the methods to respond to the sprint action input being pressed and released.
	PlayerInputComponent->BindAction("Sprint", IE_Pressed, this, &APlayerCharacter::SprintStart);
	PlayerInputComponent->BindAction("Sprint", IE_Released, this, &APlayerCharacter::SprintStop);
}

/**
 * Called when the PlayerCamera moves forward and backward.
 *
 * @param Value The axis value from the input.
 */
void APlayerCharacter::MoveForwardBackward(float Value)
{
	// Return early if the Controller is a nullptr or the axis input value is zero.
	if (GetController() == nullptr || Value == 0.f) return;

	// Find the forward rotation.
	const FRotator Rotation = GetController()->GetControlRotation();
	const FRotator YawRotation(0, Rotation.Yaw, 0);

	// Find the forward vector.
	const FVector Direction = FRotationMatrix(YawRotation).GetUnitAxis(EAxis::X);

	// Apply movement to the forward direction of the PlayerCharacter with a value
	// of `Value`.
	AddMovementInput(Direction, Value);
}

/**
 * Called when the PlayerCamera moves left and right.
 *
 * @param Value The axis value from the input.
 */
void APlayerCharacter::MoveLeftRight(float Value)
{
	// Return early if the Controller is a nullptr or the `Value` is zero.
	if (GetController() == nullptr || Value == 0.f) return;

	// Find the right rotation.
	const FRotator Rotation = GetController()->GetControlRotation();
	const FRotator YawRotation(0, Rotation.Yaw, 0);

	// Find the right direction.
	const FVector Direction = FRotationMatrix(YawRotation).GetUnitAxis(EAxis::Y);

	// Add movement to the right axis with a value of `Value`.
	AddMovementInput(Direction, Value);
}

/**
 * Called when the sprint input action button is pressed down and it sets the
 * `bIsSprinting` boolean to `true` so the animator knows to play the sprint animation.
 */
void APlayerCharacter::SprintStart()
{
	bIsSprinting = true;
	if (GetCharacterMovement()) GetCharacterMovement()->MaxWalkSpeed = SprintSpeed;
}

/**
 * Called when the sprint input action button is pressed down and it sets the
 * `bIsSprinting` boolean to `false` so the animator knows to stop the sprint animation.
 */
void APlayerCharacter::SprintStop()
{
	bIsSprinting = false;
	if (GetCharacterMovement()) GetCharacterMovement()->MaxWalkSpeed = WalkSpeed;
}
```

So now if you save, compile, drag out an instance of the PlayerCharacter, and press play (assuming you set up the mesh and animation blueprint or copied it from the repo) you should be able to move the PlayerCharacter with the input keys you specified. Also if you press the sprint button you set you should see the PlayerCharacter moving faster then if you let it go you should see it go back to walking again.

## **AllyCharacter**

Now let's see what we need for the AllyCharacter:

- A `USkeletalMeshComponent` so that we can add a mesh and see our AllyCharacter (can be found in the repo or any character from Mixamo/etc will work).

- A `UBoxComponent` to act as a box collider that will let us know when the AllyCharacter has come in contact with a Waypoint (created later on when implementing leading).

- A variable to keep a reference to the PlayerCharacter. This will be populated manually when the AllyCharacter is placed onto the level.

- A variable to know if the AllyCharacter is sprinting or not. Unlike the PlayerCharacter this will be managed by the AIController we'll create later instead of player input.

- Methods to handle what happens when a component enters the box collider.

- Methods to make the AllyCharacter sprint and stop sprinting. Just as with the variables above this will be called by the AIController instead of any input manager.

So let's get started and create a new C++ class with a base parent of Character and name it AllyCharacter. I also put mine in a folder named Ally.

Now let's create the variables and methods we discussed above in the header file:

**AllyCharacter.h**

```cpp
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "AllyCharacter.generated.h"

/**
 * The AllyCharacter follows and leads the PlayerCharacter.
 */
UCLASS(config = Game)
class FOLLOWLEADAI_API AAllyCharacter : public ACharacter
{
	GENERATED_BODY()

public:
	// Sets default values for this character's properties.
	AAllyCharacter();

	// The SkeletalMeshComponent of the AllyCharacter.
	UPROPERTY(VisibleAnywhere, BlueprintReadWrite)
	class USkeletalMeshComponent* AllySkeletalMesh;

	// The BoxComponent that to use as a trigger for detecting Waypoints.
	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	class UBoxComponent* AllyBoxCollider;

	// The PlayerCharacter to follow and lead.
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = Ally)
	class APlayerCharacter* PlayerCharacter;

	// Indicates whether the AllyCharacter is sprinting or not.
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
	bool bIsSprinting = false;

protected:
	// The speed at which the AllyCharacter should walk at.
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = Movement)
	float WalkSpeed = 200.f;

	// The speed at which the AllyCharacter should sprint at.
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = Movement)
	float SprintSpeed = 500.f;

public:
	/**
	 * Called when the AllyCharacter is created.
	 */
	void BeginPlay() override;

	/**
	 * Called when a component enters the AllyCharacter's box collider.
	 */
	UFUNCTION()
	void OnComponentEnterBoxCollider(UPrimitiveComponent* OverlappedComp, AActor* OtherActor, UPrimitiveComponent* OtherComp, int32 OtherBodyIndex, bool bFromSweep, const FHitResult& SweepResult);

	/**
	 * Called to make the AllyCharacter sprint.
	 */
	UFUNCTION()
	void SprintStart();

	/**
	 * Called to make the AllyCharacter stop sprinting
	 */
	UFUNCTION()
	void SprintStop();
};
```

Now in the AllyCharacter's cpp file we:

- Load the mesh and animation blueprint for the AllyCharacter. Again these can be found in the [repo](https://github.com/robertcorponoi/unreal-follow-lead-ai) if you need guidance or don't want to make your own.

- Create the box collider and its properties so that it acts as a trigger and then finally registers the `OnComponentEnterBoxCollider` method to respond to components entering the box collider.

**AllyCharacter.cpp**

```cpp
#include "AllyCharacter.h"

/**
 * Sets the default values for the AllyCharacter.
 */
AAllyCharacter::AAllyCharacter()
{
	static ConstructorHelpers::FObjectFinder<USkeletalMesh>AllySkeletalMeshAsset(TEXT("SkeletalMesh'/Game/Mannequin/Character/Mesh/SK_Mannequin.SK_Mannequin'"));
	static ConstructorHelpers::FObjectFinder<UAnimBlueprint>AllyAnimBlueprint(TEXT("AnimBlueprint'/Game/Blueprints/PlayerAnimBlueprint.PlayerAnimBlueprint'"));

	// Set the SkeletalMeshComponent to the Character's mesh and adjust its properties.
	AllySkeletalMesh = GetMesh();
	AllySkeletalMesh->SetSkeletalMesh(AllySkeletalMeshAsset.Object);
	AllySkeletalMesh->SetRelativeLocationAndRotation(FVector(0.f, 0.f, -90.f), FRotator(0.f, -90.f, 0.f));
	AllySkeletalMesh->SetAnimInstanceClass(AllyAnimBlueprint.Object->GeneratedClass);

	// Set the initial speed to the `WalkSpeed`.
	GetCharacterMovement()->MaxWalkSpeed = WalkSpeed;
}

/**
 * Called when the AllyCharacter is created.
 */
void AAllyCharacter::BeginPlay()
{
	Super::BeginPlay();
}

/**
 * Called when a component enters the AllyCharacter's box collider.
 */
void AAllyCharacter::OnComponentEnterBoxCollider(UPrimitiveComponent* OverlappedComp, AActor* OtherActor, UPrimitiveComponent* OtherComp, int32 OtherBodyIndex, bool bFromSweep, const FHitResult& SweepResult)
{
	// Return early if anything is null so we can avoid a potential crash.
	if ((OtherActor == nullptr) || (OtherActor == this) || (OtherComp == nullptr)) return;
}

/**
 * Called to make the AllyCharacter sprint.
 */
void AAllyCharacter::SprintStart()
{
	bIsSprinting = true;
	if (GetCharacterMovement()) GetCharacterMovement()->MaxWalkSpeed = SprintSpeed;
}

/**
 * Called to make the AllyCharacter stop sprinting.
 */
void AAllyCharacter::SprintStop()
{
	bIsSprinting = false;
	if (GetCharacterMovement()) GetCharacterMovement()->MaxWalkSpeed = SprintSpeed;
}
```

Now make sure that this saves and compiles but there's nothing to test yet as we haven't set up the AIController for the AllyCharacter yet.

## **AllyAIController**

The AllyAIController is going to be used to move the AllyCharacter to where it needs to be. This controller will evolve as we add the follow functionality and then leading functionality but let's see what we need for the basics:

- We need to keep a reference to the AllyCharacter. Unlike the PlayerCharacter reference in the AllyCharacter this one will not have to be assigned manually.

- We need to override `OnBeginPlay` as we'll add some starting logic to make the AllyCharacter move to the PlayerCharacter right away.

- We need to override `OnPossess` to make the above possible.

- We need to override `OnMoveCompleted` so that we can issue move commands consecutively instead of stacking them for better performance.

So let's get started and create a new C++ class with a base parent of AIController and name it AllyAIController. I put this class in the Ally folder alongside AllyCharacter.

Now let's get on to defining the variable and method we discussed above in the header:

**AllyAIController.h**

```cpp
#pragma once

#include "CoreMinimal.h"
#include "AIController.h"
#include "AllyAIController.generated.h"

/**
 * The AllyAIController controls the movement and behavior of the AllyCharacter.
 */
UCLASS()
class FOLLOWLEADAI_API AAllyAIController : public AAIController
{
	GENERATED_BODY()

public:
	AAllyAIController();

protected:
	// A reference to the AllyCharacter.
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = AI)
	class AAllyCharacter* AllyCharacter;

protected:
	/**
	 * Called when the AllyAIController takes over the AllyCharacter.
	 *
	 * @param AllyPawn The AllyCharacter pawn.
	 */
	virtual void OnPossess(APawn* AllyPawn) override;

	/**
	 * Called when a move request has been completed.
	 */
	virtual void OnMoveCompleted(FAIRequestID RequestID, const FPathFollowingResult& Result) override;
};
```

Now in the cpp file we assign the reference to the AllyCharacter in `OnPossess` and create the `OnMoveCompleted` method but leave it empty for now:

**AllyAIController.cpp**

```cpp
#include "AllyAIController.h"
#include "AllyCharacter.h"
#include "../Player/PlayerCharacter.h"

/**
 * Sets up the default values for the AllyAIController.
 */
AAllyAIController::AAllyAIController()
{
	// Starts the AI logic for this AIController as soon as the AllyCharacter
	// is taken over so that we can issue commands immediately.
	bStartAILogicOnPossess = true;
}

/**
 * Called when the AllyAIController takes over the AllyCharacter.
 *
 * @param AllyPawn The AllyCharacter pawn.
 */
void AAllyAIController::OnPossess(APawn* AllyPawn)
{
	Super::OnPossess(AllyPawn);

	// Attempt to cast the Pawn that was taken over to an AllyCharacter and if
	// successful then we assign it to our `AllyCharacter` variable.
	AAllyCharacter* Ally = Cast<AAllyCharacter>(AllyPawn);
	if (Ally != nullptr) AllyCharacter = Ally;
}
```

Save and compile then and then let's move on to creating the states so we can expand on our AllyAIController and actually have it control the AllyCharacter.

## **Making the AllyCharacter Follow the PlayerCharacter**

So first, we want to make the AllyCharacter follow the PlayerCharacter. While this is not very complex and we won't get into crazy detail there's some things we have to account for:

- We need to define the two states that the AllyCharacter can be in, FOLLOW and LEAD and then we need to create a variable to keep track of the AllyCharacter's current state.

- We need variables for the minimum and maximum distance that the AllyCharacter should be from the PlayerCharacter. This is used to find a random value between the two that denotes how far away the AllyCharacter stands from the PlayerCharacter.

- We need a variable for the maximum distance away the PlayerCharacter can be from the AllyCharacter before the AllyCharacter starts sprinting to catch up to the PlayerCharacter.

- We need to create a timer that will repeat and and check to see if the PlayerCharacter is moving so that we know when to make the AllyCharacter move. This is used to keep constant calls to `MoveToActor` out of `Tick` and increase performance/gameplay greatly.

- We also want to create a timer that will track whether we need to sprint or not. This could go in `Tick` but we want to avoid putting stuff in `Tick` especially if it's something that doesn't need to be run every frame.

Let's get into the header file for the AllyCharacter and define the variables we discussed above:

**AllyCharacter.h**

Note that the `AllyStates` enum goes above the class declaration.

```cpp
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "AllyCharacter.generated.h"

/**
 * The states that the AllyCharacter can be in.
 */
UENUM(BlueprintType)
enum class AllyStates : uint8 {
	FOLLOW	UMETA(DisplayName = "FOLLOW"),
	LEAD	UMETA(DisplayName = "LEAD"),
};
```

Then in the `public` section:

```cpp
// The current state of the AllyCharacter.
UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
AllyStates State = AllyStates::FOLLOW;

// The minimum distance the AllyCharacter should be from the PlayerCharacter.
UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = Ally)
float MinDistanceFromPlayer = 100.f;

// The maximum distance the AllyCharacter should be from the PlayerCharacter.
UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = Ally)
float MaxDistanceFromPlayer = 500.f;

// The maximum distance the AllyCharacter can be from the PlayerCharacter before
// they start sprinting to catch up to the PlayerCharacter.
UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = Ally)
float MaxDistanceFromPlayerBeforeSprint = MaxDistanceFromPlayer + 100.f;
```

Now in the AllyAIController we define the timers and the methods to respond to those timers:

**AllyAIController.h**

```cpp
protected:
	// A reference to the AllyCharacter.
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = AI)
	class AAllyCharacter* AllyCharacter;

	// The repeating timer used to manage the AllyCharacter's sprint state.
	FTimerHandle AllySprintTimer;

	// The repeating timer used to make the AllyCharacter follow the PlayerCharacter.
	FTimerHandle AllyFollowTimer;

protected:
	/**
	 * Called when the AllyAIController takes over the AllyCharacter.
	 *
	 * @param AllyPawn The AllyCharacter pawn.
	 */
	virtual void OnPossess(APawn* AllyPawn) override;

	/**
	 * Called when a move request has been completed.
	 */
	virtual void OnMoveCompleted(FAIRequestID RequestID, const FPathFollowingResult& Result) override;

	/**
	 * Called to move the AllyCharacter to the PlayerCharacter.
	 */
	void MoveToPlayerCharacter();

	/**
	 * Called by the `AllyFollowTimer` to check to see if the PlayerCharacter is
     * is moving or not.
	 */
	UFUNCTION()
	void CheckIfPlayerIsMoving();

	/**
	 * Called by the `AllySprintTimer` to make the AllyCharacter start or stop sprinting.
	 */
	UFUNCTION()
	void ManageAllySprint();
};
```

And now in the cpp file we have to create the `MoveToPlayerCharacter`, `CheckIfPlayerIsMoving` and `ManageAllySprint` methods. Let's go over each of these methods in detail:

**MoveToPlayerCharacter**

- Get a random float in between the `MinDistanceFromPlayer` and `MaxDistanceFromPlayer` to pass as the acceptance radius for the `MoveToActor` call.

- Call `MoveToActor` to move the AllyCharacter to the PlayerCharacter passing in the float from above as the second parameter.

**BeginPlay**

- Here we just call `MoveToPlayerCharacter` to make the AllyCharacter follow the PlayerCharacter right away.

**OnMoveCompleted**

- This method is called anytime a move command has completed which for us is after a call to `MoveToPlayerCharacter`.

- Check to see if the AllyCharacter is in a FOLLOW state and if so we get the AllyCharacter's velocity.

- If the velocity above is greater than zero, we call `MoveToPlayerCharacter` to keep the AllyCharacter moving to the PlayerCharacter.

- If the velocity is zero, we set the `AllyFollowTimer` which on an interval calls `CheckIfPlayerIsMoving` so see if the PlayerCharacter is moving so the AllyCharacter can move towards them again. This is necessary because after the PlayerCharacter stops and in turn the AllyCharacter stops, `OnMoveCompleted` will stop being called so we need to set up a timer to keep checking if we need to restart the movement with `MoveToPlayerCharacter` which in turn will start calling `OnMoveCompleted` again.

**CheckIfPlayerIsMoving**

- Get the velocity of the PlayerCharacter.

- If the velocity is above zero, we want to clear the `AllyFollowTimer` as we no longer need to check if the PlayerCharacter is moving. We then set the `AllyFollowTimer` which will repeatedly run the `ManageAllySprint` method to check if the AllyCharacter is far from the PlayerCharacter and should sprint to catch up. Lastly we call the `MoveToPlayCharacter` method to move the AllyCharacter to the PlayerCharacter again.

**ManageAllySprint**

- Get the distance from the AllyCharacter to the PlayerCharacter.

- If the distance from above is greater than or equal to the `MaxDistanceFromPlayerBeforeSprint` and the AllyCharacter currently isn't sprinting then we want to set the AllyCharacter to sprint.

- Otherwise if the distance is less than the `MaxDistanceFromPlayerBeforeSprint` and the AllyCharacter is currently sprinting then we set the AllyCharacter to not sprint.

So now let's implement this in the AllyAIController cpp file:

**AllyAIController.cpp**

```cpp
#include "AllyAIController.h"
#include "AllyCharacter.h"
#include "../Player/PlayerCharacter.h"
#include "Tasks/AITask_MoveTo.h"
#include "GameFramework/Character.h"
#include "Kismet/GameplayStatics.h"
#include "Kismet/KismetMathLibrary.h"
#include "Navigation/PathFollowingComponent.h"
#include "GameFramework/CharacterMovementComponent.h"

/**
 * Sets up the default values for the AllyAIController.
 */
AAllyAIController::AAllyAIController()
{
	// Starts the AI logic for this AIController as soon as the AllyCharacter
	// is taken over so that we can issue commands immediately.
	bStartAILogicOnPossess = true;
}

/**
 * Called when the AllyAIController starts.
 */
void AAllyAIController::BeginPlay()
{
	Super::BeginPlay();

	// Move the AllyCharacter to the PlayerCharacter from the start.
	MoveToPlayerCharacter();
}

/**
 * Called when the AllyAIController takes over the AllyCharacter.
 *
 * @param AllyPawn The AllyCharacter pawn.
 */
void AAllyAIController::OnPossess(APawn* AllyPawn)
{
	Super::OnPossess(AllyPawn);

	// Attempt to cast the Pawn that was taken over to an AllyCharacter and if
	// successful then we assign it to our `AllyCharacter` variable.
	AllyCharacter = Cast<AAllyCharacter>(AllyPawn);
}

/**
 * Called when a move request has been completed.
 */
void AAllyAIController::OnMoveCompleted(FAIRequestID RequestID, const FPathFollowingResult& Result)
{
	Super::OnMoveCompleted(RequestID, Result);

	if (AllyCharacter->State == AllyStates::FOLLOW)
	{
		// Check to see if the AllyCharacter is moving with a simple velocity check.
		bool bIsAllyCharacterMoving = AllyCharacter->GetCharacterMovement()->Velocity.Size() > 0.f;

		if (bIsAllyCharacterMoving)
		{
			// If the AllyCharacter is moving then it means that the PlayerCharacter is still moving
			// so we call `MoveToPlayerCharacter` to keep moving towards the PlayerCharacter.
			MoveToPlayerCharacter();
		}
		else
		{
			UWorld* World = GetWorld();
			if (World == nullptr) return;

			// Otherwise if the AllyCharacter is no longer moving then `OnMoveCompleted` will not run
			// again so we need to set up a repeating timer that checks to see if the PlayerCharacter
			// has started moving again and if so we cancel this timer and call `MoveToPlayerCharacter`
			// which just restarts this whole process.
			World->GetTimerManager().SetTimer(AllyFollowTimer, this, &AAllyAIController::CheckIfPlayerIsMoving, 0.05f, true);
			World->GetTimerManager().ClearTimer(AllySprintTimer);
		}
	}
}

/**
 * Called to move the AllyCharacter to the PlayerCharacter.
 */
void AAllyAIController::MoveToPlayerCharacter()
{
	// Return early if the PlayerCharacter hasn't been assigned to the AllyCharacter.
	if (AllyCharacter->PlayerCharacter == nullptr) return;

	// Get a random value between `MinDistanceFromPlayer` and `MaxDistanceFromPlayer` to use
	// as the second parameter.
	float AcceptanceRadius = UKismetMathLibrary::RandomFloatInRange(AllyCharacter->MinDistanceFromPlayer, AllyCharacter->MaxDistanceFromPlayer);

	// Move to the PlayerCharacter within the AcceptanceRadius.
	MoveToActor(AllyCharacter->PlayerCharacter, AcceptanceRadius);
}

/**
 * Called by the `AllyFollowTimer` to check to see if the PlayerCharacter is
 * is moving or not.
 */
void AAllyAIController::CheckIfPlayerIsMoving()
{
	// Check to see if the PlayerCharacter is moving by a simple velocity check.
	bool bIsPlayerCharacterMoving = AllyCharacter->PlayerCharacter->GetCharacterMovement()->Velocity.Size() > 0.f;

	if (bIsPlayerCharacterMoving)
	{
		UWorld* World = GetWorld();
		if (World == nullptr) return;

		// Clear the timer as the movement is going to get handled by the `OnMoveCompleted`
		// method until the AllyCharacter stops moving again.
		World->GetTimerManager().ClearTimer(AllyFollowTimer);

		// Set the timer that manages the AllyCharacter's movement properties such as walking
		// and sprinting.
		World->GetTimerManager().SetTimer(AllySprintTimer, this, &AAllyAIController::ManageAllySprint, 0.5, true);

		// Call `MoveToPlayerCharacter` to start this process all over again.
		MoveToPlayerCharacter();
	}
}

/**
 * Called by the `AllySprintTimer` to make the AllyCharacter start or stop sprinting.
 */
void AAllyAIController::ManageAllySprint()
{
	float DistanceFromPlayerCharacter = AllyCharacter->GetDistanceTo(AllyCharacter->PlayerCharacter);

	UCharacterMovementComponent* Movement = AllyCharacter->GetCharacterMovement();

	if (DistanceFromPlayerCharacter >= AllyCharacter->MaxDistanceFromPlayerBeforeSprint && !AllyCharacter->bIsSprinting)
	{
		// If the AllyCharacter is out of the `MaxDistanceFromPlayerBeforeSprint` value then
		// we set the AllyCharacter to sprint.
		AllyCharacter->SprintStart();
	}
	else if (DistanceFromPlayerCharacter < AllyCharacter->MaxDistanceFromPlayerBeforeSprint && AllyCharacter->bIsSprinting)
	{
		// If the AllyCharacter is not out of the `MaxDistanceFromPlayerBeforeSprint` value
		// and it is sprinting then we set it back to the walking speed.
		AllyCharacter->SprintStop();
	}
}
```

Keep in mind that above I have a mesh and skeleton loaded and if you don't update these references to your own or copy the ones from the [repo](https://github.com/robertcorponoi/unreal-follow-lead-ai) your editor will crash.

Ok now save and compile and let's get to testing it out. After compiling head over to your editor and drag out an instance of AllyCharacter onto the level and we'll adjust some settings.

First, find the Ally tab and in the PlayerCharacter reference select the PlayerCharacter that's on the scene. If you never added the PlayerCharacter to the level then drag out instance of that as well. Last thing we have to do is find the Pawn tab in the AllyCharacter and set the Auto Possess AI option to Placed in World or Spawned and the AI Controller Class to AllyAIController like so:

![Ally Pawn Settings](../../images/aug/unreal-creating-a-follow-lead-ai/allycharacter-pawn-settings.png)

And finally make sure that you have a nav mesh that covers the bounds of your level so that the AllyCharacter can actually move.

![Navmesh](../../images/aug/unreal-creating-a-follow-lead-ai/navmesh.png)

Now if you have all that set up and press play you sould see the AllyCharacter following the PlayerCharacter and if you sprint as the PlayerCharacter you'll notice that at a certain distance the AllyCharacter will also start to sprint to catch up to you and then it'll go back to walking when it's near the PlayerCharacter again.

Of course this is pretty simple but it handles fluid AI movement without overlapping logic in `Tick`.

## **Making the AllyCharacter Lead the PlayerCharacter**

Now that we have the AllyCharacter following the PlayerCharacter, let's work on having the AllyCharacter lead the PlayerCharacter. We're going to accomplish this by setting up one or more waypoints that the AllyCharacter goes between. We'll also set it up so that if the PlayerCharacter gets too far away from the AllyCharacter then the AllyCharacter will stop and wait for the PlayerCharacter to get closer before proceeding.

So to get started on this, we need to create the waypoints that the AllyCharacter will use for navigation when leading. These Waypoints will need:

- A `UBoxComponent` to act as a box collider so that the AllyCharacter knows when it has come to a waypoint.

- A variable that tracks what number waypoint this is. This is needed as the waypoints will be found automatically by the AllyCharacter and they will be sorted by their index.

So let's get started by creating a new C++ class that has a base parent of Actor and name it WaypointActor and let's get into defining the properties and methods we need in the header file:

**WaypointActor.h**

```cpp
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "WaypointActor.generated.h"

UCLASS()
class FOLLOWLEADAI_API AWaypointActor : public AActor
{
	GENERATED_BODY()
	
public:	
	// Sets default values for this actor's properties.
	AWaypointActor();

	// The `UBoxComponent` of this WaypointActor that lets the AllyCharacter
	// know when it has arrived at this WaypointActor.
	UPROPERTY(VisibleAnywhere, BlueprintReadWrite)
	class UBoxComponent* WaypointBoxCollider;

	// The number waypoint that this WaypointActor is. The AllyCharacter will
	// follow waypoints in order.
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = Waypoint)
	int32 WaypointNumber = 0;
};
```

And in the cpp file we just create the box collider and set its initial extents:

**WaypointActor.cpp**

```cpp
#include "WaypointActor.h"
#include "Components/BoxComponent.h"

/**
 * Sets the default values for the WaypointActor.
 */
AWaypointActor::AWaypointActor()
{
	// Create the box collider, set its default extents to something we can see,
	// and then attach it to the RootComponent.
	WaypointBoxCollider = CreateDefaultSubobject<UBoxComponent>(TEXT("WaypointBoxCollider"));
	WaypointBoxCollider->SetBoxExtent(FVector(90.f, 90.f, 90.f));
	WaypointBoxCollider->SetupAttachment(RootComponent);
}
```

So now we'll need to hop back to our AllyCharacter and add some more variables. We'll need:

- A variable for the maximum distance away the AllyCharacter can be from the PlayerCharacter while leading before they stop and wait for the PlayerCharacter to catch up.

- A variable that keeps track of the WaypointActor that the AllyCharacter is currently moving towards.

- A variable that keeps track of the WaypointActor that the AllyCharacter should stop at.

- A boolean that keeps track of whether the AllyCharacter has made it to the current WaypointActor. This is used in instances where the AllyCharacter needs to go through multiple waypoints.

- A map that will be populated in `BeginPlay` by all of the WaypointActors in the current level.

- A boolean to remember if the AllyCharacter should wait for the PlayerCharacter for the current leading request.

Let's go ahead and define these in the header:

**AllyCharacter.h**

```cpp
// The maximum distance the PlayerCharacter can be from the AllyCharacter when
// following before the AllyCharacter waits for them to catch up.
UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = Ally)
float MaxDistanceFromPlayerWhileLeading = 500.f;

// The WaypointActor that the AllyCharacter is currently moving towards.
UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
class AWaypointActor* CurrentWaypoint;

// The WaypointActor that the AllyCharacter is ending at.
UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
class AWaypointActor* EndWaypoint;

// Indicates whether the AllyCharacter has arrived at the WaypointActor marked
// as the `CurrentWaypoint` or not.
bool bIsAtCurrentWaypoint = false;

// A map of all of the Waypoints in the current level.
UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
TMap<int, AWaypointActor*> Waypoints;

// Indicates whether the AllyCharacter should wait for the PlayerCharacter when leading.
// This is set by the AllyAIController.
bool bShouldWaitForPlayerWhenLeading = false;
```

And then in the cpp file we'll start off by populating the `Waypoints` map by getting all of the WaypointActors in the level and then sorting the map by its keys. Lastly we'll add functionality to `OnComponentEnterBoxCollider` to check whether the AllyCharacter is the LEAD state and what they've collided with is a WaypointActor and if so we set `bIsAtCurrentWaypoint` to `true`.

Also you'll have to include the WaypointActor header in the AllyCharacter cpp file:

**AllyCharacter.cpp**

```cpp
#include "AllyCharacter.h"
#include "../WaypointActor.h"
#include "GameFramework/CharacterMovementComponent.h"
```

```cpp
/**
 * Called when the AllyCharacter is created.
 */
void AAllyCharacter::BeginPlay()
{
	Super::BeginPlay();

	// Get all of the WaypointActors in the level.
	TArray<AActor*> FoundActors;
	UGameplayStatics::GetAllActorsOfClass(GetWorld(), AWaypointActor::StaticClass(), FoundActors);

	// For each WaypointActor we found we have to try and cast it as a WaypointActor
	// as they are found as Actors not WaypointActors. If we can successfully cast it
	// to a WaypointActor then we add it to the WaypointActors map.
	for (AActor* FoundActor : FoundActors)
	{
		AWaypointActor* Waypoint = Cast<AWaypointActor>(FoundActor);

		// If we can successfully cast the Actor to a WaypointActor then we add it to
		// the map with the WaypointNumber as the key and WaypointActor as the value.
		if (Waypoint != nullptr) Waypoints.Add(Waypoint->WaypointNumber, Waypoint);
	}

	// After all of the Waypoints have been added to the Waypoints map then we sort the
	// map by its keys, which are the WaypointNumbers.
	Waypoints.KeySort([](int A, int B) { return A < B; });
}

/**
 * Called when a component enters the AllyCharacter's box collider.
 */
void AAllyCharacter::OnComponentEnterBoxCollider(UPrimitiveComponent* OverlappedComp, AActor* OtherActor, UPrimitiveComponent* OtherComp, int32 OtherBodyIndex, bool bFromSweep, const FHitResult& SweepResult)
{
	// Return early if anything is null so we can avoid a potential crash.
	if ((OtherActor == nullptr) || (OtherActor == this) || (OtherComp == nullptr)) return;

	// Try to cast the `OtherActor` to a WaypointActor.
	AWaypointActor* Waypoint = Cast<AWaypointActor>(OtherActor);

	// If the AllyCharacter is in the LEAD state and we were able to successfully cast the `OtherActor`
	// to a WaypointActor, then we set `bIsAtCurrentWaypoint` to `true`.
	if (State == AllyStates::LEAD && Waypoint != nullptr) bIsAtCurrentWaypoint = true;
}
```

And that's it for the AllyCharacter for now. There's nothing to test yet so just make sure to save and compile before we move on to next part.

Now since the PlayerCharacter is going to be the one issuing commands, we have to create the functionality so that the PlayerCharacter can tell the AllyCharacter to lead. This can be implemented anywhere not just the PlayerCharacter but for the purposes of this demo it'll be easier to show since we're just going to tie the lead action to an action input for the demo.

So let's see what we need to add to the PlayerCharacter:

- A delegate that will be broadcast when we want the AllyCharacter to lead which in our case will be when the "Lead" action input is pressed.

- The above delegate is going to have 3 parameters. The `WaypointNumber` of where the AllyCharacter should start, the `WaypointNumber` of where the AllyCharacter should end, and whether the AllyCharacter should wait for the PlayerCharacter to be in `MaxDistanceFromPlayerWhileLeading` range before continuing or not.

- We also need to create a variable that we can use to broadcast the signal.

- Since we're going to ask the AllyCharacter to lead when we press the F key, we need to create a method to respond to the F key being pressed.

Let's go ahead and define these two things in the PlayerCharacter's header. Note that the delegate goes outside of the class, I put it under the includes.

**PlayerCharacter.h**

```cpp
// Creates a delegate that's used to tell the AllyAIController to make
// the AllyCharacter lead the way.
DECLARE_DYNAMIC_MULTICAST_DELEGATE_ThreeParams(FAllyLeadRequest, int32, StartWaypoint, int32, EndWaypoint, bool, bShouldWaitForPlayer);
```

```cpp
// Broadcast when the PlayerCharacter triggers an object in the level that
// that makes the AllyCharacter switch to the LEAD state or when the PlayerCharacter
// is deemed to be "lost".
UPROPERTY(BlueprintAssignable, Category = "StateEvents")
FAllyLeadRequest OnAllyLeadRequest;
```

Down where our other methods are defined:

```cpp
/**
 * Called when the "Lead" action input is pressed.
 */
void LeadAction();
```

Now in the cpp file we have to create the `LeadAction` method and register it with the `PlayerInputComponent`.

**PlayerCharacter.cpp**

```cpp
/**
 * Called to bind functionality to input.
 *
 * @param PlayerInputComponent An Actor component for input bindings.
 */
void APlayerCharacter::SetupPlayerInputComponent(UInputComponent* PlayerInputComponent)
{
	check(PlayerInputComponent);

	// Set up the methods to respond to the PlayerCharacter moving forward, backward,
	// left, and right.
	PlayerInputComponent->BindAxis("MoveForwardBackward", this, &APlayerCharacter::MoveForwardBackward);
	PlayerInputComponent->BindAxis("MoveLeftRight", this, &APlayerCharacter::MoveLeftRight);

	// Set the "TurnLeftRight" and "LookUpDown" axis inputs to control the yaw and pitch
	// of the camera.
	PlayerInputComponent->BindAxis("TurnLeftRight", this, &APlayerCharacter::AddControllerYawInput);
	PlayerInputComponent->BindAxis("LookUpDown", this, &APlayerCharacter::AddControllerPitchInput);

	// Set up the methods to respond to the sprint action input being pressed and released.
	PlayerInputComponent->BindAction("Sprint", IE_Pressed, this, &APlayerCharacter::SprintStart);
	PlayerInputComponent->BindAction("Sprint", IE_Released, this, &APlayerCharacter::SprintStop);

	// Set up the method to respond to the AllyLead action input being pressed.
	PlayerInputComponent->BindAction("AllyLead", IE_Pressed, this, &APlayerCharacter::LeadAction);
}

/**
 * Called when the "Lead" action input is pressed.
 */
void APlayerCharacter::LeadAction()
{
	// Make the AllyCharacter lead the PlayerCharacter from the first waypoint to the
	// second waypoint and waiting for the PlayerCharacter to be in range.
	OnAllyLeadRequest.Broadcast(1, 2, true);
}
```

And we're done with the PlayerCharacter and onto the final piece, the AllyAIController. Make sure that the above is saved and compiles and let's move on to that.

Again our goal is to avoid the use of the `Tick` method so we're going to need to create a timer that runs the Waypoint movement logic. So with that said let's see what we need for the AllyAIController:

- A method named `MakeAllyLead` that'll respond to the PlayerCharacter broadcasting the signal indicating that the AllyCharacter should lead from waypoint A to waypoint B.

- A method named `MoveToWaypoint` that'll check to see if the AllyCharacter needs to wait for the PlayerCharacter and move to the current WaypointActor.

- A timer that will repeat and call the `MoveToWaypoint` method.

- We need to add on to the `OnMoveCompleted` method to see if the AllyCharacter is at the ending WaypointActor then it needs to put the AllyCharacter back to the FOLLOW state. If there are still more waypoints to go to then it sets the `CurrentWaypoint` property of the AllyCharacter to the next WaypointActor so it can walk to the next waypoint.

Let's go ahead and define the above in the AllyAIController's header file:

**AllyAIController.h**

```cpp
// The repeating timer used to make the AllyCharacter lead the PlayerCharacter.
FTimerHandle AllyLeadTimer;
```

```cpp
/**
 * Called to move the AllyCharacter to its `CurrentWaypoint`.
 */
void MoveToWaypoint();

/**
 * Called when`OnAllyLeadRequest` is broadcast to put the AllyCharacter in the LEAD
 * state and make them move to a waypoint.
 */
UFUNCTION()
void MakeAllyLead(int32 WaypointA, int32 WaypointB, bool bShouldWaitForPlayer);
```

and now in the cpp file we create the methods defined above and add the logic we discussed:

**AllyAIController.cpp**

Make sure you have the following includes:

```cpp
#include "AllyCharacter.h"
#include "../WaypointActor.h"
#include "../Player/PlayerCharacter.h"
#include "Tasks/AITask_MoveTo.h"
#include "GameFramework/Character.h"
#include "Kismet/GameplayStatics.h"
#include "Kismet/KismetMathLibrary.h"
#include "Navigation/PathFollowingComponent.h"
#include "GameFramework/CharacterMovementComponent.h"
```

```cpp
/**
 * Called when the AllyAIController starts.
 */
void AAllyAIController::BeginPlay()
{
	Super::BeginPlay();

	// Set up the response to the PlayerCharacter's `OnAllyLeadRequest` delegate.
	AllyCharacter->PlayerCharacter->OnAllyLeadRequest.AddDynamic(this, &AAllyAIController::MakeAllyLead);

	// Move the AllyCharacter to the PlayerCharacter from the start.
	MoveToPlayerCharacter();
}

/**
 * Called when a move request has been completed.
 */
void AAllyAIController::OnMoveCompleted(FAIRequestID RequestID, const FPathFollowingResult& Result)
{
	Super::OnMoveCompleted(RequestID, Result);

	if (AllyCharacter->State == AllyStates::FOLLOW)
	{
		// Check to see if the AllyCharacter is moving with a simple velocity check.
		bool bIsAllyCharacterMoving = AllyCharacter->GetCharacterMovement()->Velocity.Size() > 0.f;

		if (bIsAllyCharacterMoving)
		{
			// If the AllyCharacter is moving then it means that the PlayerCharacter is still moving
			// so we call `MoveToPlayerCharacter` to keep moving towards the PlayerCharacter.
			MoveToPlayerCharacter();
		}
		else
		{
			UWorld* World = GetWorld();
			if (World == nullptr) return;

			// Otherwise if the AllyCharacter is no longer moving then `OnMoveCompleted` will not run
			// again so we need to set up a repeating timer that checks to see if the PlayerCharacter
			// has started moving again and if so we cancel this timer and call `MoveToPlayerCharacter`
			// which just restarts this whole process.
			World->GetTimerManager().SetTimer(AllyFollowTimer, this, &AAllyAIController::CheckIfPlayerIsMoving, 0.05f, true);
			World->GetTimerManager().ClearTimer(AllySprintTimer);
		}
	}
	else if (AllyCharacter->State == AllyStates::LEAD)
	{
		if (AllyCharacter->CurrentWaypoint == AllyCharacter->EndWaypoint && AllyCharacter->bIsAtCurrentWaypoint)
		{
			// If the AllyCharacter is at the last waypoint then we can clear the lead timer and set
			// them back to the FOLLOW state.
			GetWorld()->GetTimerManager().ClearTimer(AllyLeadTimer);
			AllyCharacter->State = AllyStates::FOLLOW;

			// Set the AllyCharacter to move to the PlayerCharacter again to keep the follow loop going.
			MoveToPlayerCharacter();
		}
		else if (AllyCharacter->bIsAtCurrentWaypoint)
		{
			// Otherwise we set the AllyCharacter to move to the next waypoint.
			AllyCharacter->CurrentWaypoint = AllyCharacter->Waypoints[AllyCharacter->CurrentWaypoint->WaypointNumber + 1];
			AllyCharacter->bIsAtCurrentWaypoint = false;
		}
	}
}

/**
 * Called to move the AllyCharacter to a WaypointActor.
 */
void AAllyAIController::MoveToWaypoint()
{
	// Make sure that this is only called when the AllyCharacter is in the
	// LEAD state.
	if (AllyCharacter->State != AllyStates::LEAD) return;

	// If `AllyCharacter->bShouldWaitForPlayerWhenLeading` is true then we need to check
	// to see if the PlayerCharacter is too far from the AllyCharacter and if so then we
	// stop movement until the PlayerCharacter gets closer. Otherwise we just continue to
	// the WaypointActor.
	float AllyDistanceFromPlayer = AllyCharacter->GetDistanceTo(AllyCharacter->PlayerCharacter);
	if (AllyCharacter->bShouldWaitForPlayerWhenLeading && AllyDistanceFromPlayer >= AllyCharacter->MaxDistanceFromPlayerWhileLeading)
	{
		StopMovement();
	}
	else
	{
		MoveToActor(AllyCharacter->CurrentWaypoint);
	}
}

/**
 * Responds to the `OnAllyLeadRequest` to put the AllyCharacter in the LEAD
 * state and make them move to a waypoint.
 */
void AAllyAIController::MakeAllyLead(int WaypointA, int WaypointB, bool bShouldWaitForPlayer)
{
	// Put the AllyCharacter in the LEAD state.
	AllyCharacter->State = AllyStates::LEAD;

	// Clear the AllyFollowTimer if the AllyCharacter was in the FOLLOW state before.
	GetWorld()->GetTimerManager().ClearTimer(AllyFollowTimer);

	// Set the AllyCharcter's `CurrentWaypoint` to `WaypointA` and `EndWaypoint` to `WaypointB`.
	AllyCharacter->CurrentWaypoint = AllyCharacter->Waypoints[WaypointA];
	AllyCharacter->EndWaypoint = AllyCharacter->Waypoints[WaypointB];

	AllyCharacter->bShouldWaitForPlayerWhenLeading = bShouldWaitForPlayer;

	// Move to the next WaypointActor which could be WaypointA, WaypointB, or a WaypointActor
	// in between.
	GetWorld()->GetTimerManager().SetTimer(AllyLeadTimer, this, &AAllyAIController::MoveToWaypoint, 0.5f, true);
}
```

Now save and compile and let's get to the fun part, the testing. Go ahead and drag two WaypointActors onto the scene and extend their box extents out a bit so that they cover a bigger area. Make sure that you give one of them a `WaypointNumber` of 0 and the other a `WaypointNumber` of 1. Now if you press play you'll notice the AllyCharacter following you as usual but if you press the input action for "AllyLead" (probably F if you followed what I did) then you'll see the AllyCharacter walking towards the first WaypointActor. Now if you don't follow the AllyCharacter then it'll eventually stop because you're out of range and you need to get closer before it continues towards the WaypointActor. After it gets to the first WaypointActor it should start heading for the next one. Finally when the AllyCharacter is done with the waypoints it'll go back to following the PlayerCharacter.

**Note:** If your AllyCharacter is not going towards the WaypointActors then the changes might have not been picked up so the best thing you can do is start fresh by deleting the existing PlayerCharacter and AllyCharacter and drag out new instances of them. Then set the reference to the PlayerCharacter in the AllyCharacter and set the AIController class to AllyAIController class like we did above.

## **Conclusion**

Well that's all for this tutorial, I might come back to this in a future tutorial and expand it to show how the AllyAIController can be used to help the PlayerCharacter in combat but this is a good starting template for any projects you might have that need similar functionality. If you would like to see a specific topic for the next article don't hesitate to send me a message and I'll do my best to make it happen. Also make sure to check out the [repo](https://github.com/robertcorponoi/unreal-follow-lead-ai) for an example of everything we created in this tutorial along with animation classes and blueprints.
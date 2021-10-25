---
title: Creating a Zombie AI
slug: unreal-creating-interactive-actors
date: "2020-08-30"
description: Learn how to create an Zombie that roams, chases, and attacks the player
tags: ["unreal", "game-development"]
---

In this tutorial we'll be taking a look at how to make a Zombie AI that roams, chases, and attacks the player. Let's take a look at the classes we'll need to make this happen.

- **BulletActor** - The BulletActor is the projectile that gets shot from the PlayerCharacter's gun and is used when we go over killing the zombie.

- **PlayerCharacter** - The PlayerCharacter is going to be the Character from the Unreal FPS demo that we'll expand on.

- **ZombieCharacter** - This is going to be the Character of each individual zombie.

- **ZombieAIController** - This is going to be the AIController used to decide the movements and actions of the zombie.

## **BulletActor**

Before we get into the PlayerCharacter, since this will be a first person shooter character, we'll need to create the class for the bullet that gets shot out of the PlayerCharacter's gun. We need to create this first as the PlayerCharacter will have a reference to the BulletActor.

Let's see what the BulletActor will need:

- Create a `UStaticMeshComponent` so we can assign the BulletActor a mesh.

- Since the shape of the bullet will be a sphere we need a `USphereComponent` to act as a sphere collider.

- To make bullet physics easier we'll use a `UProjectileMovementComponent` to manage the bullet's position after being shot.

- We have to create the method that gets called when the the bullet has made contact with another component.

So now that we know what we need to accomplish let's go ahead and create a new C++ class with a base parent of Actor and name it BulletActor. I also placed mine in a new folder named Player since it's only used by the PlayerCharacter so it helps me keep the workspace cleaner.

Now let's define all of the things we discussed above in the BulletActor's header:

**BulletActor.h**

```cpp
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "BulletActor.generated.h"

/**
 * The BulletActor is the projectile that's shot out of the PlayerCharacter's gun.
 */
UCLASS()
class ZOMBIEHORDEAI_API ABulletActor : public AActor
{
	GENERATED_BODY()
	
public:	
	// Sets default values for this actor's properties.
	ABulletActor();

	// The static mesh of the BulletActor.
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = Bullet)
	class UStaticMeshComponent* BulletStaticMesh;

	// The sphere collider of the BulletActor.
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = Bullet)
	class USphereComponent* BulletSphereCollider;

	// The projectile movement component of the BulletActor.
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = Bullet)
	class UProjectileMovementComponent* BulletMovement;

public:	
	/**
	 * Called when the BulletActor hits another component.
	 */
	UFUNCTION()
	void OnBulletHitComponent(UPrimitiveComponent* HitComp, AActor* OtherActor, UPrimitiveComponent* OtherComp, FVector NormalImpulse, const FHitResult& Hit);
};

```

And now in the cpp we create the sphere collider and movement components and set their default values. We also set the `OnBulletHitComponent` method to respond whenever the BulletActor hits another component.

**BulletActor.cpp**

```cpp
#include "BulletActor.h"
#include "Components/SphereComponent.h"
#include "Components/StaticMeshComponent.h"
#include "GameFramework/ProjectileMovementComponent.h"

/**
 * Sets the default values of the BulletActor.
 */
ABulletActor::ABulletActor()
{
	// Load the BulletActor's mesh.
	static ConstructorHelpers::FObjectFinder<UStaticMesh> BulletStaticMeshAsset(TEXT("StaticMesh'/Game/FirstPerson/Meshes/FirstPersonProjectileMesh.FirstPersonProjectileMesh'"));

	// Create the sphere collider, set its radius, set it to have a collision profile
	// of Projectile and lastly add the `OnBulletHitComponent` method to respond to the
	// sphere collider making contact with another component.
	BulletSphereCollider = CreateDefaultSubobject<USphereComponent>(TEXT("BulletSphereCollider"));
	BulletSphereCollider->InitSphereRadius(20.f);
	BulletSphereCollider->SetCollisionProfileName("Projectile");
	BulletSphereCollider->OnComponentHit.AddDynamic(this, &ABulletActor::OnBulletHitComponent);
	RootComponent = BulletSphereCollider;

	// Create the bullet mesh, set it to the `BulletStaticMesh` loaded above and attach
	// it to the `BulletSphereCollider`.
	BulletStaticMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("BulletStaticMesh"));
	BulletStaticMesh->SetStaticMesh(BulletStaticMeshAsset.Object);
	BulletStaticMesh->SetRelativeScale3D(FVector(0.1f, 0.1f, 0.1f));
	BulletStaticMesh->UnWeldFromParent();
	BulletSphereCollider->SetCollisionProfileName("NoCollision");
	BulletStaticMesh->SetupAttachment(RootComponent);

	// Create the ProjectileMovementComponent and set its speeds and default properties.
	BulletMovement = CreateDefaultSubobject<UProjectileMovementComponent>(TEXT("BulletMovement"));
	BulletMovement->UpdatedComponent = BulletSphereCollider;
	BulletMovement->InitialSpeed = 3000.f;
	BulletMovement->MaxSpeed = 3000.f;
	BulletMovement->bRotationFollowsVelocity = true;
	BulletMovement->bShouldBounce = false;

	// Set the BulletActor to die after 3 seconds.
	InitialLifeSpan = 3.f;
}

/**
 * Called when the BulletActor hits another component.
 */
void ABulletActor::OnBulletHitComponent(UPrimitiveComponent* HitComp, AActor* OtherActor, UPrimitiveComponent* OtherComp, FVector NormalImpulse, const FHitResult& Hit)
{
	// We want to return early if anything is null as it could cause a crash otherwise.
	if ((OtherActor == nullptr) || (OtherActor == this) || (OtherComp == nullptr)) return;

	if (OtherComp->IsSimulatingPhysics())
	{
		// If the component that the BulletActor hit is using physics then we want
		// to add an impulse force where the BulletActor hit to move them back.
		OtherComp->AddImpulseAtLocation(GetVelocity() * 100.f, GetActorLocation());
	}

	Destroy();
}
```

Now that we've got the BulletActor squared away we can move on to the PlayerCharacter.

## **PlayerCharacter**

The PlayerCharacter is just a standard first person character and uses the model and animations from Unreal's first person demo but we'll go over it quickly so that we're all on the same page when we expand on it later. If you already have a PlayerCharacter you want to use feel free to skip this part, otherwise you can check out the [repo](https://github.com/robertcorponoi/unreal-zombie-ai) for an already made one to use or just follow the PlayerCharacter creation guide below.

So let's see what our PlayerCharacter will need:

- A `USkeletalMeshComponent` for the PlayerCharacter's body/arms mesh.

- A `USkeletalMeshComponent` for the PlayerCharacter's gun mesh.

- A `USceneComponent` that keeps track of where the gun's bullets should be shot from.

- A `UCameraComponent` for the first person camera.

- A `UAnimMontage` for the gun fire animation that's populated in the constructor (I got this and the models from the Unreal first person demo project so you can either get the assets from there or from the [repo](https://github.com/robertcorponoi/unreal-zombie-ai)).

- We need methods to handle when the "Fire" input action is pressed and for when the movement input axis keys are used.

So let's go ahead and create a new C++ class with a base parent of Character, name it PlayerCharacter, and put it in the Player folder if you created that earlier.

Now let's take a look at how we can implement the above in the header:

**PlayerCharacter.h**

```cpp
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "PlayerCharacter.generated.h"

class USkeletalMeshComponent;

/**
 * The PlayerCharacter is the main player of the game.
 */
UCLASS()
class ZOMBIEHORDEAI_API APlayerCharacter : public ACharacter
{
	GENERATED_BODY()

public:
	// Sets default values for this character's properties.
	APlayerCharacter();

	// The skeletal mesh of the PlayerCharacter's body.
	UPROPERTY(VisibleDefaultsOnly, Category = Player)
	USkeletalMeshComponent* PlayerSkeletalMesh;

	// The skeletal mesh of the PlayerCharacter's gun.
	UPROPERTY(VisibleDefaultsOnly, Category = Player)
	USkeletalMeshComponent* GunSkeletalMesh;

	// The location on the gun where the BulletActors should spawn from.
	UPROPERTY(VisibleDefaultsOnly, Category = Player)
	class USceneComponent* BulletSpawnLocation;

	// The first-person camera of the PlayerCharacter.
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = Player)
	class UCameraComponent* PlayerCamera;

	// The gun's offset from the PlayerCharacter's location.
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = Player)
	FVector GunOffset;

	// The AnimMontage to play when the gun is fired. This is set automatically
	// in the constructor.
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = Player)
	class UAnimMontage* GunFireAnimation;

protected:
	/**
	 * Called to bind functionality to input.
	 */
	virtual void SetupPlayerInputComponent(class UInputComponent* PlayerInputComponent) override;

	/**
	 * Called when the MoveForwardBackward input axis is used.
	 */
	void MoveForwardBackward(float Value);

	/**
	 * Called when the MoveLeftRight input axis is used.
	 */
	void MoveLeftRight(float Value);

	/**
	 * Called when the "Fire" input action button is pressed.
	 */
	void Fire();
};
```

Now in the cpp we're going to:

- Load our PlayerCharacter body and gun meshes and also the gun animation blueprint and montage. Again these can be found in the Unreal fps demo or the [repo](https://github.com/robertcorponoi/unreal-zombie-ai).

- Create the camera, position it, and attach it to the default capsule collider.

- Create the body mesh, set it to be the skeletal mesh we loaded above, set some options such as having it not cast shadows, and attach it to the camera created above.

- Create the gun mesh, set it to the skeletal mesh we loaded above, and set it to have some of the same settings as the body mesh. We also attach the gun mesh to the body mesh at the GripPoint.

- Set the `GunFireAnimation` variable to the animation asset loaded during the first step.

- In the `SetupPlayerInputComponent` method we need to register our methods to their corresponding inputs.

- We need to create the `MoveForwardBackward`, `MoveLeftRight`, and `Fire` methods to handle what happens when the inputs get pressed.

- The movement methods are pretty self explanatory as they just use `AddMovementInput` and add it to that direction. The `Fire` method spawns a BulletActor at the end of the gun's muzzle and plays the shooting animation for the gun.

There's quite a lot going on in the constructor but really it's not all necessary and its just for a cleaner looking demo:

**PlayerCharacter.cpp**

```cpp
#include "PlayerCharacter.h"
#include "BulletActor.h"
#include "Kismet/GameplayStatics.h"
#include "Animation/AnimInstance.h"
#include "Camera/CameraComponent.h"
#include "Components/CapsuleComponent.h"
#include "Components/SkeletalMeshComponent.h"
#include "Components/InputComponent.h"
#include "GameFramework/InputSettings.h"
#include "GameFramework/CharacterMovementComponent.h"

/**
 * Sets the default value from the PlayerCharacter
 */
APlayerCharacter::APlayerCharacter()
{
	// Load the player and gun skeletal meshes.
	static ConstructorHelpers::FObjectFinder<USkeletalMesh> PlayerSkeletalMeshAsset(TEXT("SkeletalMesh'/Game/FirstPerson/Character/Mesh/SK_Mannequin_Arms.SK_Mannequin_Arms'"));
	static ConstructorHelpers::FObjectFinder<USkeletalMesh> GunSkeletalMeshAsset(TEXT("SkeletalMesh'/Game/FirstPerson/FPWeapon/Mesh/SK_FPGun.SK_FPGun'"));

	// Load the gun fire animation.
	static ConstructorHelpers::FObjectFinder<UAnimBlueprint> GunAnimBlueprintAsset(TEXT("AnimBlueprint'/Game/FirstPerson/Animations/FirstPerson_AnimBP.FirstPerson_AnimBP'"));
	static ConstructorHelpers::FObjectFinder<UAnimMontage> GunFireAnimationAsset(TEXT("AnimMontage'/Game/FirstPerson/Animations/FirstPersonFire_Montage.FirstPersonFire_Montage'"));

	// Create the first person camera, set its relative location and attach it to the
	// capsule component.
	PlayerCamera = CreateDefaultSubobject<UCameraComponent>(TEXT("PlayerCamera"));
	PlayerCamera->SetRelativeLocation(FVector(-40.f, 2.f, 70.f));
	PlayerCamera->bUsePawnControlRotation = true;
	PlayerCamera->SetupAttachment(GetCapsuleComponent());

	// Create the player mesh component and set up its position and defaults and
	// lastly attach it to the PlayerCamera.
	PlayerSkeletalMesh = CreateDefaultSubobject<USkeletalMeshComponent>(TEXT("PlayerSkeletalMesh"));
	PlayerSkeletalMesh->SetSkeletalMesh(PlayerSkeletalMeshAsset.Object);
	PlayerSkeletalMesh->SetRelativeLocationAndRotation(FVector(-0.5f, -4.5f, -155.f), FRotator(2.f, -20.f, 5.f));
	PlayerSkeletalMesh->SetOnlyOwnerSee(true);
	PlayerSkeletalMesh->SetAnimInstanceClass(GunAnimBlueprintAsset.Object->GeneratedClass);
	PlayerSkeletalMesh->CastShadow = false;
	PlayerSkeletalMesh->bCastDynamicShadow = false;
	PlayerSkeletalMesh->CanCharacterStepUpOn = ECB_Yes;
	PlayerSkeletalMesh->SetupAttachment(PlayerCamera);
	PlayerSkeletalMesh->SetHiddenInGame(false, true);

	// Create the gun mesh component and set up its defaults and lastly attach it to
	// the RootComponent and the grip point of the PlayerSkeletalMesh.
	GunSkeletalMesh = CreateDefaultSubobject<USkeletalMeshComponent>(TEXT("GunSkeletalMesh"));
	GunSkeletalMesh->SetSkeletalMesh(GunSkeletalMeshAsset.Object);
	GunSkeletalMesh->SetOnlyOwnerSee(true);
	GunSkeletalMesh->CastShadow = false;
	GunSkeletalMesh->bCastDynamicShadow = false;
	GunSkeletalMesh->CanCharacterStepUpOn = ECB_Yes;
	GunSkeletalMesh->SetBoundsScale(2.f);
	GunSkeletalMesh->SetupAttachment(PlayerSkeletalMesh, TEXT("GripPoint"));
	GunSkeletalMesh->SetupAttachment(RootComponent);
	GunSkeletalMesh->AttachToComponent(PlayerSkeletalMesh, FAttachmentTransformRules(EAttachmentRule::SnapToTarget, true), TEXT("GripPoint"));

	// Set the gun fire animation to the montage loaded above.
	GunFireAnimation = GunFireAnimationAsset.Object;

	// Set the size of the PlayerCharacter's capsule collider.
	GetCapsuleComponent()->InitCapsuleSize(55.f, 100.f);
	GetCapsuleComponent()->CanCharacterStepUpOn = ECB_Yes;

	// Set the default offset for where the BulletActors should spawn.
	GunOffset = FVector(100.f, 0.f, 10.f);

	// Set the PlayerCharacter to be the default player of the game.
	AutoPossessPlayer = EAutoReceiveInput::Player0;
}

/**
 * Called to bind functionality to input.
 */
void APlayerCharacter::SetupPlayerInputComponent(UInputComponent* PlayerInputComponent)
{
	check(PlayerInputComponent);

	// Bind the forward, backward, left, and right movement input axis to the
	// `MoveForwardBackward` and `MoveLeftRight` methods.
	PlayerInputComponent->BindAxis("MoveForwardBackward", this, &APlayerCharacter::MoveForwardBackward);
	PlayerInputComponent->BindAxis("MoveLeftRight", this, &APlayerCharacter::MoveLeftRight);

	// Bind the mouse x and y axis to controlling the yaw and pitch.
	PlayerInputComponent->BindAxis("LookUpDown", this, &APawn::AddControllerYawInput);
	PlayerInputComponent->BindAxis("LookLeftRight", this, &APawn::AddControllerPitchInput);

	// Bind the jump input action to the default Character jump logic.
	PlayerInputComponent->BindAction("Jump", IE_Pressed, this, &ACharacter::Jump);
	PlayerInputComponent->BindAction("Jump", IE_Released, this, &ACharacter::StopJumping);

	// Bind the fire input action to the `Fire` method.
	PlayerInputComponent->BindAction("Fire", IE_Pressed, this, &APlayerCharacter::Fire);
}

/**
 * Called when the MoveForwardBackward input axis is used.
 */
void APlayerCharacter::MoveForwardBackward(float Value)
{
	if (Value != 0.f) AddMovementInput(GetActorForwardVector(), Value);
}

/**
 * Called when the MoveLeftRight input axis is used.
 */
void APlayerCharacter::MoveLeftRight(float Value)
{
	if (Value != 0.f) AddMovementInput(GetActorRightVector(), Value);
}

/**
 * Called when the Fire input action is pressed.
 */
void APlayerCharacter::Fire()
{
	// Return early if `GetWorld()` returns a nullptr.
	UWorld* const World = GetWorld();
	if (World == nullptr) return;

	const FRotator SpawnRotation = GetControlRotation();
		
	// Since the `BulletSpawnLocation` is in camera space, we have to transform it to
	// world space before offsetting it from the character location to find the final
	// bullet spawn location.
	const FVector SpawnLocation = ((BulletSpawnLocation != nullptr) ? BulletSpawnLocation->GetComponentLocation() : GetActorLocation()) + SpawnRotation.RotateVector(GunOffset);

	// Set Spawn Collision Handling Override.
	FActorSpawnParameters ActorSpawnParams;
	ActorSpawnParams.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AdjustIfPossibleButDontSpawnIfColliding;

	// Spawn the BulletActor at the SpawnLocation.
	World->SpawnActor<ABulletActor>(ABulletActor::StaticClass(), SpawnLocation, SpawnRotation, ActorSpawnParams);

	// Get the animation object for the PlayerCharacter's body mesh and play the fire animation.
	UAnimInstance* AnimInstance = PlayerSkeletalMesh->GetAnimInstance();
	if (AnimInstance == nullptr) return;

	AnimInstance->Montage_Play(GunFireAnimation, 1.f);
}
```

Now that we're on the same page with the PlayerCharacter, let's move on to creating the ZombieCharacter.

## **ZombieCharacter Setup**

Before we get into the code I'll go over the assets I'm using from Mixamo real quick.

- Zombie Jill Character

- Zombie Idle Animation

- Zombie Dying Animation

- Zombie Attack Animation

- Zombie Walking Animation

- Zombie Run Animation

Also make sure that the animations are set to be in place, with skin, and 60 frames per second.

In my Unreal project I made a folder named Models and another one named Animations and I placed the Zombie Character in a sub-folder in the models folder and the animations in the Animations folder.

So now we have to do is define and create the initial setup of the ZombieCharacter which is:

- A `USkeletalMeshComponent` for assigning the zombie the skeletal mesh we imported above.

- A boolean that contains the value for whether the ZombieCharacter is sprinting or not. This will be read by the AnimInstance to decide whether the Sprint animation should be played or not.

- We need to load the Zombie skeletal mesh in the constructor and assign it to the component defined above.

We also want to implement states. States are going to be used by the AIController when we create it later to guide the movement and actions of the ZombieCharacter. Let's determine what states we need:

- We want an IDLE state in which the ZombieCharacter is just standing around as most zombies do.

- We want a ROAM state in which the ZombieCharacter just walks around with no real purpose.

- We want a CHASE state for when the ZombieCharacter is chasing the PlayerCharacter attempting to attack them.

- We want an ATTACK state for when the ZombieCharacter is attempting to attack the PlayerCharacter.

- We want a DEAD state for when the PlayerCharacter has killed the ZombieCharacter.

So glancing at the above ZombieCharacters are either going to be in an IDLE or ROAMING state right when they spawn. Then, when the ZombieCharacter spots the PlayerCharacter, they will enter the CHASE state and if they manage to catch up to the PlayerCharacter they will enter the ATTACK state. At this point they will keep switching between CHASE and ATTACK depending on if the PlayerCharacter is attempting to run away or not. Finally this ends with the ZombieCharacter either back in the IDLE/ROAM state if they've lost sight of the PlayerCharacter or in the DEAD state if the PlayerCharacter has killed them.
So let's go ahead and implement this.

Let's go ahead now and add the components discussed above and also the states we just went over:

**ZombieCharacter.h**

```cpp
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "ZombieCharacter.generated.h"

/**
 * The states that the ZombieCharacter can be in.
 */
UENUM(BlueprintType)
enum class ZombieStates : uint8 {
	IDLE	UMETA(DisplayName = "IDLE"),
	ROAM	UMETA(DisplayName = "ROAM"),
	CHASE	UMETA(DisplayName = "CHASE"),
	ATTACK	UMETA(DisplayName = "ATTACK"),
	DEAD	UMETA(DisplayName = "DEAD"),
};

/**
 * A zombie that can roam, chase, and attack.
 */
UCLASS()
class ZOMBIEHORDE_API AZombieCharacter : public ACharacter
{
	GENERATED_BODY()

public:
	// Sets default values for this character's properties.
	AZombieCharacter();

	// The skeletal mesh of the ZombieCharacter.
	UPROPERTY(VisibleDefaultsOnly, Category = Mesh)
	class USkeletalMeshComponent* ZombieSkeletalMesh;

	// The current state of the ZombieCharacter.
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = Zombie)
	ZombieStates State = ZombieStates::IDLE;

	// The previous state of the ZombieCharacter.
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = Zombie)
	ZombieStates PreviousState = State;

	// Indicates whether the ZombieCharacter is sprinting or not.
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
	bool bIsSprinting = false;
};
```

**ZombieCharacter.cpp**

```cpp
#include "ZombieCharacter.h"
#include "Components/SkeletalMeshComponent.h"

/**
 * Sets the default values for the ZombieCharacter.
 */
AZombieCharacter::AZombieCharacter()
{
	// Load the assets needed for the ZombieCharacter.
	static ConstructorHelpers::FObjectFinder<USkeletalMesh>ZombieSkeletalMeshAsset(TEXT("SkeletalMesh'/Game/Models/ZombieJill/jill.jill'"));

	// Create the ZombieCharacter's skeletal mesh and set it to be the mesh loaded above.
	ZombieSkeletalMesh = GetMesh();
	ZombieSkeletalMesh->SetSkeletalMesh(ZombieSkeletalMeshAsset.Object);
	ZombieSkeletalMesh->SetRelativeLocation(FVector(0.f, 0.f, -90.f));
	ZombieSkeletalMesh->SetupAttachment(RootComponent);
}
```

Make sure that the above compiles and then let's move on.

Now that we have the basics of the ZombieCharacter set up, we can create the AnimInstance class for it. We want to manage the animation states in C++ and then we'll use those in an animation blueprint.

So let's get started and create the AnimInstance class by creating a new C++ class with a base parent of AnimInstance and name it ZombieAnimInstance. I also put mine in a sub-folder named Zombie.

Let's see what we'll need in the ZombieAnimInstance:

- We need booleans to know if the ZombieCharacter is moving roaming, sprinting, attacking, or dead. These will be used to show the various animations.

- We need a method that will be called by the animation blueprint to update these booleans.

Let's get into the header file:

**ZombieAnimInstance.h**

```cpp
#pragma once

#include "CoreMinimal.h"
#include "Animation/AnimInstance.h"
#include "ZombieAnimInstance.generated.h"

/**
 * Manages the booleans needed by the animation blueprint to decide what
 * animation needs to be run.
 */
UCLASS()
class ZOMBIEAI_API UZombieAnimInstance : public UAnimInstance
{
	GENERATED_BODY()

public:
	// Indicates whether the ZombieCharacter is roaming or not.
	UPROPERTY(EditAnywhere, BlueprintReadOnly)
	bool bIsRoaming;

	// Indicates whether the ZombieCharacter is chasing or not.
	UPROPERTY(EditAnywhere, BlueprintReadOnly)
	bool bIsChasing;

	// Indicates whether the ZombieCharacter is attacking or not.
	UPROPERTY(EditAnywhere, BlueprintReadOnly)
	bool bIsAttacking;

	// Indicates whether the ZombieCharacter is dying or not.
	UPROPERTY(EditAnywhere, BlueprintReadOnly)
	bool bIsDying;

	// Used by the animation blueprint to update the animation properties above
	// and decide what animations to play.
	UFUNCTION(BlueprintCallable, Category = "UpdateAnimationProperties")
	void UpdateAnimationProperties();
};
```

**ZombieAnimInstance.cpp**

```cpp
#include "ZombieAnimInstance.h"
#include "ZombieCharacter.h"
#include "../Player/PlayerCharacter.h"
#include "Math/Rotator.h"
#include "Components/BoxComponent.h"
#include "Components/CapsuleComponent.h"
#include "GameFramework/CharacterMovementComponent.h"

/**
 * Used by the animation blueprint to update the animation properties above
 * and decide what animations to play.
 */
void UZombieAnimInstance::UpdateAnimationProperties()
{
	// Try to get the Pawn being animated and return if a nullptr.
	APawn* ZombiePawn = TryGetPawnOwner();
	if (ZombiePawn == nullptr) return;

	// Try to cast the Pawn to our ZombieCharacter since that's the only
	// thing we want to animate.
	AZombieCharacter* ZombieCharacter = Cast<AZombieCharacter>(ZombiePawn);
	if (ZombieCharacter == nullptr) return;

	// Set the variables that are dependent on states.
	bIsRoaming = ZombieCharacter->State == ZombieStates::ROAM;
	bIsChasing = ZombieCharacter->State == ZombieStates::CHASE;
	bIsAttacking = ZombieCharacter->State == ZombieStates::ATTACK;
	bIsDying = ZombieCharacter->State == ZombieStates::DEAD;
}
```

Ok so now we need to go back to Unreal and create the animation blueprint based off of the ZombieAnimInstance created above. So in your blueprints folder you have to right-click, select to create a new Animation Blueprint, and in the Create Animation Blueprint dialogue you need to make sure it has a parent class of ZombieAnimInstance and a target skeleton of zombie.

![Zombie Create Animation Blueprint](../../images/aug/unreal-zombie-ai/zombie-create-animation-blueprint.png)

This will open up to the AnimGraph and here you want to right-click and create a new state machine and connect it to the output pose like so:

![Zombie Animation Blueprint Anim Graph](../../images/aug/unreal-zombie-ai/zombie-animation-blueprint-anim-graph.png)

And then you want to switch to the Event Graph tab, delete the Try Get Pawn Owner node, and drag out from the Blueprint Update Animation node and connect it to the UpdateAnimationProperties node like so:

![Zombie Animation Blueprint Event Graph](../../images/aug/unreal-zombie-ai/zombie-animation-blueprint-event-graph.png)

And then finally we'll create our states and their transitions:

![Zombie Animation Blueprint Event Graph](../../images/aug/unreal-zombie-ai/zombie-animations-initial.png)

I won't list the transitions here as it's a bit tedious but it's pretty easy to set it up since for now we're just using `bIsRoaming`, `bIsChasing`, and `bIsAttacking` but feel free to look at the [repo](https://github.com/robertcorponoi/unreal-zombie-ai) if you need help.

Also note that we're not using the death animation yet but we'll add that later.

So now we can go back to our ZombieCharacter, load the ZombieAnimBlueprint, and set it as the anim instance class of the `ZombieSkeletalMesh`:

**ZombieCharacter.cpp**

```cpp
/**
 * Sets the default values for the ZombieCharacter.
 */
AZombieCharacter::AZombieCharacter()
{
	// Load the assets needed for the ZombieCharacter.
	static ConstructorHelpers::FObjectFinder<USkeletalMesh>ZombieSkeletalMeshAsset(TEXT("SkeletalMesh'/Game/Models/ZombieJill/jill.jill'"));
	static ConstructorHelpers::FObjectFinder<UAnimBlueprint>ZombieAnimAsset(TEXT("AnimBlueprint'/Game/Blueprints/ZombieAnimBlueprint.ZombieAnimBlueprint'"));

	// Create the ZombieCharacter's skeletal mesh and set it to be the mesh loaded above.
	ZombieSkeletalMesh = GetMesh();
	ZombieSkeletalMesh->SetSkeletalMesh(ZombieSkeletalMeshAsset.Object);
	ZombieSkeletalMesh->SetRelativeLocation(FVector(0.f, 0.f, -90.f));
	ZombieSkeletalMesh->SetAnimInstanceClass(ZombieAnimAsset.Object->GeneratedClass);
	ZombieSkeletalMesh->SetupAttachment(RootComponent);
}
```

Now let's get into creating the AIController for the ZombieCharacter so that we can make it move around and respond to the PlayerCharacter.

## **Adding a Stimuli Source to the PlayerCharacter**

Before we can get into the AIController for the ZombieCharacter, we need to improve detection and performance by making sure that the AIController doesn't sense all Pawns and we need to create a stimuli source on the PlayerCharacter so that the ZombieCharacter knows it's supposed to see the PlayerCharacter.

So we have to:

- Change ini setting so that not all Pawns are registered as sources for stimuli.

- Add a `UAIPerceptionStimuliSourceComponent` to the PlayerCharacter to manage the their stimuli sources. In our case we'll only be using sight but you can add more than one sense if you wish.

- Add`UAISense_Sight` as a registered sense for the PlayerCharacter.

First let's handle the first point by setting `bAutoRegisterAllPawnsAsSources` to `false` in the `Config/DefaultGame.ini` file:

**DefaultGame.ini**

```ini
[/Script/AIModule.AISense_Sight]
bAutoRegisterAllPawnsAsSources=false
```

Now let's go ahead and define the `UAIPerceptionStimuliSourceComponent` in the PlayerCharacter's header:

**PlayerCharacter.h**

```cpp
// Used to register sense for the PlayerCharacter that are detectable by the ZombieCharacter.
UPROPERTY(VisibleDefaultsOnly, Category = Player)
class UAIPerceptionStimuliSourceComponent* PlayerStimuliSource;
```

And then in the cpp file we create the component in the constructor and register the sight sense:

**PlayerCharacter.cpp**

```cpp
// Create the stimuli source and set it to register as a source for `AISense_Sight`.
PlayerStimuliSource = CreateDefaultSubobject<UAIPerceptionStimuliSourceComponent>(TEXT("PlayerStimuliSource"));
PlayerStimuliSource->RegisterForSense(TSubclassOf<UAISense_Sight>());
```

All the above does is make sure that not every pawn triggers the zombie's sight and we specifically make our PlayerCharacter a trigger. This helps with performance and making sure the AI doesn't get distracted by other zombies and neutral characters.

**Note:** I was having a bit of trouble with the above and no matter what I did the stimuli component would not register a sight sense and I had to set that up in my component manually in the editor. As soon as I find out what the issue is I'll update this with the solution if others are having the same problem.

## **ZombieAIController Perception**

Now let's get on to the fun part, the ZombieAIController. This doesn't mean that we're done with all of the other pieces yet, we'll need to keep adding to the PlayerCharacter and ZombieCharacter but this is where all of the ZombieCharacter's actions and movement are decided.

Let's see what we're going to need from the ZombieAIController as of now:

- We need a `UAIPerceptionComponent` so that we can perceive the PlayerCharacter.

- We need `UAISenseConfig_Sight` to attach to the component above in order to detect the PlayerCharacter through sight.

- We need a couple variables to tweak the range and age of the sight component.

- We need to override the `OnPosses` method so we can get a reference to our ZombieCharacter.

- We need to define the method that gets called when the perception component broadcasts the `OnTargetPerceptionUpdated` signal.

And that's all for now, we just want to keep it simple and make sure that the basics work before progressing further. Go ahead and create a new C++ class with a base parent of AIController and name it ZombieAIController. I put my script in the Zombie folder since it's used directly with the ZombieCharacter.

Now in the ZombieAIController's header, we declare the two components and the variables used to configure the sight:

**ZombieAIController.h**

```cpp
#pragma once

#include "CoreMinimal.h"
#include "AIController.h"
#include "GenericTeamAgentInterface.h"
#include "Perception/AIPerceptionTypes.h"
#include "ZombieAIController.generated.h"

/**
 * The ZombieAIController is the AIController that manages the states and movement
 * of the ZombieCharacter.
 */
UCLASS()
class ZOMBIEHORDEAI_API AZombieAIController : public AAIController
{
	GENERATED_BODY()

public:
	AZombieAIController();

	// The ZombieCharacter that the ZombieAIController is controlling.
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = Zombie)
	class AZombieCharacter* ZombieCharacter;

	// The ZombieCharacter's perception component.
	UPROPERTY(VisibleDefaultsOnly, Category = Zombie)
	class UAIPerceptionComponent* ZombiePerception;

	// The ZombieCharacter's sight sense component.
	UPROPERTY(VisibleDefaultsOnly, Category = Zombie)
	class UAISenseConfig_Sight* ZombieSight;

	// The radius around the ZombieCharacter that the PlayerCharacter will be sensed.
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = Zombie)
	float ZombieSightRadius = 500.f;

	// The radius around the ZombieCharacter which they'll lose sight of the PlayerCharacter.
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = Zombie)
	float ZombieLoseSightRadius = ZombieSightRadius + 50.f;

	// The amount of time that the ZombieCharacter will remember the PlayerCharacter after
	// seeing them.
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = Zombie)
	float ZombieSightMaxAge = 5.f;

protected:
	/**
	 * Called when the ZombieAIController takes over the ZombieCharacter.
	 *
	 * @param ZombieCharacter The ZombieCharacter pawn.
	 */
	virtual void OnPossess(APawn* ZombiePawn) override;

	/**
	 * Called when the AIController's perception is updated.
	 */
	UFUNCTION()
	void OnTargetPerceptionUpdate(AActor* Actor, FAIStimulus Stimulus);
};
```

Now in the cpp file we:

- Create the perception and sight and set the variables for the sight.

- Set the sight to detect enemies, neutrals, and friendlies as we'll be handling teams later.

- Set the sight sense to be the dominant sense of the perception component.

- Create the `OnPossess` method and assign the `ZombieCharacter variable if we can cast the Pawn that was possessed to our ZombieCharacter.

- Create the `OnTargetPerceptionUpdate` method that gets all of the currently perceived actors, and uses that to check if the Actor has entered or left the sight radius Lastly we print this information out to the screen so you can see that it works.

**ZombieAIController.cpp**

```cpp
#include "ZombieAIController.h"
#include "Perception/AISense_Sight.h"
#include "Perception/AISenseConfig_Sight.h"
#include "Perception/AIPerceptionComponent.h"

/**
 * Sets the default values for the ZombieAIController.
 */
AZombieAIController::AZombieAIController()
{
	// Create the perception component and the sight component and set the default values
	// of the sight component.
	ZombiePerception = CreateDefaultSubobject<UAIPerceptionComponent>(TEXT("ZombiePerception"));
	ZombieSight = CreateDefaultSubobject<UAISenseConfig_Sight>(TEXT("ZombieSight"));
	ZombieSight->SightRadius = ZombieSightRadius;
	ZombieSight->LoseSightRadius = ZombieLoseSightRadius;
	ZombieSight->SetMaxAge(ZombieSightMaxAge);
	ZombieSight->DetectionByAffiliation.bDetectEnemies = true;
	ZombieSight->DetectionByAffiliation.bDetectNeutrals = true;
	ZombieSight->DetectionByAffiliation.bDetectFriendlies = true;

	// Assign the sight sense to the perception component.
	ZombiePerception->ConfigureSense(*ZombieSight);
	ZombiePerception->SetDominantSense(ZombieSight->GetSenseImplementation());

	// Bind the `OnTargetPerceptionUpdate` function.
	ZombiePerception->OnTargetPerceptionUpdated.AddDynamic(this, &AZombieAIController::OnTargetPerceptionUpdate);
}

/**
 * Called when the ZombieAIController takes over the ZombieCharacter.
 *
 * @param ZombiePawn The ZombieCharacter pawn.
 */
void AZombieAIController::OnPossess(APawn* ZombiePawn)
{
	Super::OnPossess(ZombiePawn);

	// Attempt to cast the Pawn that was taken over to a ZombieCharacter and if
	// successful then we assign it to our `ZombieCharacter` variable.
	ZombieCharacter = Cast<AZombieCharacter>(ZombiePawn);
}

/**
 * Called when the AIController's perception is updated.
 */
void AZombieAIController::OnTargetPerceptionUpdate(AActor* Actor, FAIStimulus Stimulus)
{
	// Get the Actors that have been perceived.
	TArray<AActor*> PerceivedActors;
	ZombiePerception->GetCurrentlyPerceivedActors(TSubclassOf<UAISense_Sight>(), PerceivedActors);

	// Get the number of perceived actors and if the current target left or entered
	// the field of view.
	bool bIsEntered = PerceivedActors.Contains(Actor);
	int NumberOfObjectsSeen = PerceivedActors.Num();

	FString text = FString(Actor->GetName() + " has just " + (bIsEntered ? "Entered" : "Left") + " the field of view.");

	if (GEngine)
	{
		GEngine->AddOnScreenDebugMessage(-1, 5.f, FColor::Cyan, text);
	}
}
```

Before we can test this, we have to do back to the ZombieController and make the ZombieAIController the default AIController:

**ZombieCharacter.cpp**

```cpp
/**
 * Sets the default values for the ZombieCharacter.
 */
AZombieCharacter::AZombieCharacter()
{
	// Load the assets needed for the ZombieCharacter.
	static ConstructorHelpers::FObjectFinder<USkeletalMesh>ZombieSkeletalMeshAsset(TEXT("SkeletalMesh'/Game/Models/ZombieJill/jill.jill'"));
	static ConstructorHelpers::FObjectFinder<UAnimBlueprint>ZombieAnimAsset(TEXT("AnimBlueprint'/Game/Blueprints/ZombieAnimBlueprint.ZombieAnimBlueprint'"));

	// Create the ZombieCharacter's skeletal mesh and set it to be the mesh loaded above.
	ZombieSkeletalMesh = GetMesh();
	ZombieSkeletalMesh->SetSkeletalMesh(ZombieSkeletalMeshAsset.Object);
	ZombieSkeletalMesh->SetRelativeLocation(FVector(0.f, 0.f, -90.f));
	ZombieSkeletalMesh->SetAnimInstanceClass(ZombieAnimAsset.Object->GeneratedClass);
	ZombieSkeletalMesh->SetupAttachment(RootComponent);

	// Set the default AIController of the class.
	AIControllerClass = AZombieAIController::StaticClass();
	AutoPossessAI = EAutoPossessAI::PlacedInWorldOrSpawned;
}
```

Save and compile all this and now let's go back to Unreal and drag an instance of the ZombieCharacter into the scene. Now if you press press and walk in front of the ZombieCharacter, you should see a debug message pop up on the screen saying that the PlayerCharacter has entered the ZombieCharacter's field of view. Now if you leave the field of view the message should show that you've left.

You can also enable the gameplay debugger under Edit->Project Settings->Gameplay Debugger like so:

![Debug Settings](../../images/aug/unreal-zombie-ai/debugger-settings.png)

and now when you press play you can press the apostrophe key and it'll show the ZombieCharacter's sight radius and also show when you're inside of it.

## **Implementing the IDLE and Roam States**

So now that we have our ZombieCharacter detecting our PlayerCharacter, we should take a step back and first create the IDLE and ROAM states of the ZombieCharacter.

We'll start with what variables we'll need for the ZombieCharacter:

- We'll need a variable named `StartLocation` that will be populated on `BeginPlay` with the current location of the ZombieCharacter. This is going to be used to limit the ZombieCharacter's roaming area by making it we always move it in reference to its starting location instead of their current location that they roamed to.

- We need a variable that tells the ZombieAIController whether this ZombieCharacter can roam or not. If this is set to `false` then the ZombieCharacter will never move unless it has spotted the PlayerCharacter and is chasing them.

- We need a variable for the speed of the ZombieCharacter while they're in the ROAM state.

- We need a variable that says how far from its starting location the ZombieCharacter can roam. This will be used by the ZombieAIController to choose a random spot within this area that the ZombieCharacter can walk to.

- We need a variable for how long of a delay we are going to have between roam calls. Setting this to a value above 0 will mean that after the ZombieCharacter has roamed to a location, they will wait x amount of seconds before they roam to another location.

Now let's see what methods we need to add to the ZombieCharacter:

- We need to override `BeginPlay` to set the `StartingLocation` variable.

- We need to add a method to transition the ZombieCharacter to the IDLE state.

- We need to add a method to transition the ZombieCharacter to the ROAM state.

**Note:** While in our state transitions we're just going to set the new state and the new walk speed of the ZombieCharacter, you can add whatever properties you wish the ZombieCharacter to have in these states.

Now let's head on over to the header and define what we discussed above:

**ZombieCharacter.h**

```cpp
// The starting location of the ZombieCharacter, used when roaming.
UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = RoamState)
FVector StartLocation;

// Indicates whether the ZombieCharacter should be able to roam or not.
UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = RoamState)
bool bCanRoam = true;

// The max speed of the ZombieCharacter in the ROAM state.
UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = RoamState)
float RoamSpeed = 100.f;

// The max range around its spawn point that the ZombieCharacter can roam.
UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = RoamState)
float RoamRadius = 300.f;

// The amount of time to pause in between `Roam` calls. If set to 0 there will
// be no delay.
UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = RoamState)
float RoamDelay = 3.f;
```

Then, we add a `protected` block with the `BeginPlay` method defined:

```cpp
protected:
	/**
	 * Called when the game starts.
	 */
	virtual void BeginPlay() override;
```

And lastly we define a public block with the IDLE and ROAM state transitions:

```cpp
public:
	/**
	 * Called to transition the ZombieCharacter to the IDLE state.
	 */
	void ToIdleState();

	/**
	 * Called to transition the ZombieCharacter to the ROAM state.
	 */
	void ToRoamState();
```

Now in the cpp file we create these methods and for the `ToRoamState` method we set the new `MaxWalkSpeed` of the ZombieCharacter:

**ZombieCharacter.cpp**

```cpp
/**
 * Called when the game starts.
 */
void AZombieCharacter::BeginPlay()
{
	Super::BeginPlay();

	// Set the starting location of the ZombieCharacter.
	StartLocation = GetActorLocation();
}

/**
 * Called to transition the ZombieCharacter to the IDLE state.
 */
void AZombieCharacter::ToIdleState()
{
	PreviousState = State;
	State = ZombieStates::IDLE;
}

/**
 * Called to transition the ZombieCharacter to the ROAM state.
 */
void AZombieCharacter::ToRoamState()
{
	PreviousState = State;
	State = ZombieStates::ROAM;

	UCharacterMovementComponent* ZombieMovement = GetCharacterMovement();
	if (ZombieMovement != nullptr)
	{
		ZombieMovement->MaxWalkSpeed = RoamSpeed;
	}
}
```

You'll also need the following include for the above to work:

```cpp
#include "GameFramework/CharacterMovementComponent.h"
```

Now let's look at the ZombieAIController will need to make the ZombieCharacter roam.

We're going to need the following variables:

- A variable for the timer that will be used to delay calls to the method that makes the ZombieCharacter roams. 

Now let's see what methods we need:

- We need to create the `Roam` method that will be called to make the ZombieCharacter roam to a random spot. This spot is chosen from a bounding box as wide as `RoamBox` and then a `MoveToLocation` command is issued to move the ZombieCharacter to that spot.

- We need to override the `BeginPlay` method so that we can set the ZombieCharacter to roam if it can.

- We need to override the `OnMoveCompleted` method which is called when a call to `Roam` is complete. This method will check to see if the ZombieCharacter is still in the ROAM state and if so then we set a timer to wait x amount of time before calling `Roam` again.

So roaming is going to be a repeating sequence of these steps:

1. The `Roam` method is called and the ZombieCharacter is put into the ROAM state and then the ZombieAIController picks a random spot from the `RoamBox`.

2. A `MoveToLocation` command is issued to move the ZombieCharacter to the above location.

3. Once the move is complete, the `OnMoveCompleted` method is called and this checks to see if the ZombieCharacter is still in the ROAM state and if so, it puts the ZombieCharacter in the IDLE state, so that the idle animation can play, and then it sets a timer that when it expires, it calls the `Roam` method all over again.

Ok so let's define the variables and methods in the header file:

**ZombieAIController.h**

```cpp
// The timer used to pause between `Roam` calls.
FTimerHandle RoamIdleTimer;

// The amount of time to pause in between `Roam` calls.
UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = RoamState)
float RoamDelay = 3.f;
```

And then further down under the `protected` block:

```cpp
/**
 * Called when the game starts.
 */
virtual void BeginPlay() override;

/**
 * Called when a move request has been completed.
 */
virtual void OnMoveCompleted(FAIRequestID RequestID, const FPathFollowingResult& Result) override;

/**
 * Called to make the ZombieCharacter roam to a different location within its
 * roam radius.
 */
void Roam();
```

Now let's create the methods in the cpp file:

**ZombieAIController.cpp**

```cpp
/**
 * Called when the game starts.
 */
void AZombieAIController::BeginPlay()
{
	Super::BeginPlay();

	// Simple check but this can be made more complex.
	if (ZombieCharacter->bCanRoam) Roam();
}

/**
 * Called when a move request has been completed.
 */
void AZombieAIController::OnMoveCompleted(FAIRequestID RequestID, const FPathFollowingResult& Result)
{
	Super::OnMoveCompleted(RequestID, Result);

	if (ZombieCharacter->State == ZombieStates::ROAM)
	{
		if (ZombieCharacter->RoamDelay > 0.f)
		{
			// If there is a roam delay, we need to set the ZombieCharacter to the idle state
			// while we set a timer to run before `Roam` is called again.
			ZombieCharacter->ToIdleState();

			UWorld* World = GetWorld();
			if (World != nullptr)
			{
				GetWorld()->GetTimerManager().SetTimer(RoamIdleTimer, this, &AZombieAIController::Roam, ZombieCharacter->RoamDelay, false);
			}
		}
		else {
			// Otherwise we can just call `Roam` again instantly.
			Roam();
		}
	}
}

/**
 * Called to make the ZombieCharacter roam to a different location within its
 * roam radius.
 */
void AZombieAIController::Roam()
{
	// Put the ZombieCharacter in the ROAM state if they are not already. This is important
	// because when this move is complete, it gets put into an IDLE state so we need to put
	// ourselves back into a ROAM state.
	ZombieCharacter->ToRoamState();

	// Choose a random point within a bounding box with an origin of the ZombieCharacter's
	// spawn location so that the ZombieCharacter will never roam to new places.
	FVector RoamLocation = UKismetMathLibrary::RandomPointInBoundingBox(ZombieCharacter->StartLocation,
		FVector(
			ZombieCharacter->StartLocation.X + ZombieCharacter->RoamRadius,
			ZombieCharacter->StartLocation.Y + ZombieCharacter->RoamRadius,
			ZombieCharacter->StartLocation.Z
		)
	);

	MoveToLocation(RoamLocation);
}
```

You'll also need to include the following header for `UKismetMathLibrary::RandomPointInBoundingBox`:

```cpp
#include "Kismet/KismetMathLibrary.h
```

So now if you save and compile, and replace the instance of the ZombieCharacter in the scene just for good measure since we added more stuff in the constructor, you can press play and see this in action. You'll see the ZombieCharacter walk to a position nearby, wait for 3 seconds, then walk to another random nearby position.

At this point you can mess with the `RoamDelay` to have less or more time in between `Roam` calls or you can just set it to 0 have no delay while roaming. If you're using the animations that I am, it might look a bit sudden when the ZombieCharacter transitions from walking to being idle. This is purely because I have limited access to animations but if you had more animations or were making your own you could make an in-between animation or blend animations for smoother transitions.

## **Implementing the CHASE and ATTACK states**

So now that we have our ZombieCharacter's IDLE and ROAM states set up, let's set up the part that relies on the sight sense, chasing and attacking the PlayerCharacter.

Again just like we did with the IDLE and ROAM state, let's go over what we need to add to the ZombieCharacter first.

Here's the variables we'll need to create:

- We need a variable that defines how fast the ZombieCharacter will move will in the CHASE state.

- We need a variable for how long of a delay there should be between the ZombieCharacter chasing the PlayerCharacter and going back to the ROAM state if they can roam. This is to avoid an awkward transition from chasing straight to another animation. With a delay it'll look like the ZombieCharacter is still looking at the PlayerCharacter as they run away and after x seconds they'll go back to idle/roaming.

- Also we need a variable for how much damage an attack from the ZombieCharacter will do to the PlayerCharacter.

- Finally, we'll need a variable for the amount of time between attacks. This should be the same amount of time that the attack animation is so that we don't end the attack animation early.

And then let's take a look at the methods we'll need:

- We need methods to transition the ZombieCharacter to the CHASE and ATTACK states just like we did for the IDLE and ROAM states.

So let's get to defining these in the header file:

**ZombieCharacter.h**

```cpp
// The max speed of the ZombieCharacter in the CHASE state.
UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = ChaseState)
float ChaseSpeed = 300.f;

// The amount of delay after a chase after which the ZombieCharacter will
// resume to roam. This is to help break up an awkward transition from chasing
// straight back to roaming.
UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = ChaseState)
float AfterChaseDelay = 3.f;

// The amount of damage that the ZombieCharacter does when attacking.
UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = AttackState)
float AttackDamage = 5.f;

// The amount of delay between attacks, this should be the length of the attack
// animation so that attack animations don't stack up.
UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = AttackState)
float TimeBetweenAttacks = 2.f;
```

And then further down where we defined `ToRoamState`:

```cpp
/**
 * Called to transition the ZombieCharacter to the CHASE state.
 */
void ToChaseState();

/**
 * Called to transition the ZombieCharacter to the ATTACK state.
 */
void ToAttackState();
```

Now in the cpp file we create the `ToChaseState` and `ToAttackState` methods. In the `ToChaseState` method we set the new state and change the max walk speed to the `ChaseSpeed` value and in the `ToAttackState` method we just change the state.

**ZombieCharacter.cpp**

```cpp
/**
 * Called to transition the ZombieCharacter to the CHASE state.
 */
void AZombieCharacter::ToChaseState()
{
	PreviousState = State;
	State = ZombieStates::CHASE;

	UCharacterMovementComponent* ZombieMovement = GetCharacterMovement();
	if (ZombieMovement != nullptr)
	{
		ZombieMovement->MaxWalkSpeed = ChaseSpeed;
	}
}

/**
 * Called to transition the ZombieCharacter to the ATTACK state.
 */
void AZombieCharacter::ToAttackState()
{
	PreviousState = State;
	State = ZombieStates::ATTACK;
}
```

Now it's time for the fun part again, adding all of the functionality to the ZombieAIController to enable the ZombieCharacter to chase and attack the PlayerCharacter.

We're only going to need one new variable here:

- We need a another `FTimerHandle` to handle the delay between the ZombieCharacter chasing the PlayerCharacter and going back to what it was doing before.

And now for the methods:

- A `Chase` method that takes the PlayerCharacter as an argument and it calls `MoveToActor` as long as the PlayerCharacter has been seen by the ZombieCharacter.

- A `StopChase` method that stops the ZombieCharacter from chasing the method and sets the timer to make the ZombieCharacter idle after it has lost sight of the PlayerCharacter for a period of time before they go back to the ROAM state.

- A `IdleOrRoam` method that will replace the call to `Roam` in the `BeginPlay` method. This has been moved into its own method because now we need to check if the ZombieCharacter was in the CHASE state previously and if so we update the `StartLocation` of the ZombieCharacter so that they don't walk all the way back to their initial starting location before they roam again. Instead the ZombieCharacter will now begin roaming at the location they stopped chasing the PlayerCharacter.

Let's go ahead and define all this in the header first:

**ZombieAIController.h**

```cpp
/**
 * Checks to see if the PlayerCharacter should be idling or roaming and then proceeds to do so. If
 * the ZombieCharacter's `PreviousState` was `CHASE` and the ZombieCharacter is supposed to roam then
 * the `StartLocation` will be updated to be the current location as we don't want the ZombieCharacter
 * to go all the way back to the initial `StartLocation`.
 */
void IdleOrRoam();

/**
 * Called to make the ZombieCharacter chase the PlayerCharacter.
 *
 * @param PlayerCharacter The PlayerCharacter to chase.
 */
void Chase(class APlayerCharacter* PlayerCharacter);

/**
 * Called to make the ZombieCharacter stop chasing the PlayerCharacter and go
 * back to being idle/roaming.
 */
void StopChase();
```

And now in the cpp file we create these methods:

**ZombieAIController.cpp**

```cpp
/**
 * Called when the game starts.
 */
void AZombieAIController::BeginPlay()
{
	Super::BeginPlay();

	// Put the ZombieCharacter in the IDLE or ROAM state depending on whether they can roam or not.
	IdleOrRoam();
}

/**
 * Checks to see if the PlayerCharacter should be idling or roaming and then proceeds to do so. If
 * the ZombieCharacter's `PreviousState` was `CHASE` and the ZombieCharacter is supposed to roam then
 * the `StartLocation` will be updated to be the current location as we don't want the ZombieCharacter
 * to go all the way back to the initial `StartLocation`.
 */
void AZombieAIController::IdleOrRoam()
{
	if (ZombieCharacter->bCanRoam)
	{
		// Check to see if the previous state was `CHASE` because if so we need to set the `StartLocation`
		// to the ZombieCharacter's current location.
		if (ZombieCharacter->PreviousState == ZombieStates::CHASE)
		{
			ZombieCharacter->StartLocation = ZombieCharacter->GetActorLocation();
		}

		// Call the `Roam` method so the ZombieCharacter starts roaming.
		Roam();
	}
	else
	{
		ZombieCharacter->ToIdleState();
	}
}

/**
 * Called to make the ZombieCharacter chase the PlayerCharacter.
 * 
 * @param PlayerCharacter The PlayerCharacter to chase.
 */
void AZombieAIController::Chase(APlayerCharacter* PlayerCharacter)
{
	ZombieCharacter->ToChaseState();

	MoveToActor(PlayerCharacter);
}

/**
 * Called to make the ZombieCharacter stop chasing the PlayerCharacter and go
 * back to being idle/roaming.
 */
void AZombieAIController::StopChase()
{
	// First we have to stop all movement so the ZombieCharacter quits chasing the PlayerCharacter
	// since they're not supposed to see them anymore.
	StopMovement();

	if (ZombieCharacter->AfterChaseDelay > 0.f)
	{
		UWorld* World = GetWorld();
		if (World != nullptr)
		{
			// If there is an after chase delay then we set the PlayerCharacter to the IDLE state until the
			// `ChaseIdleTimer` expires and runs the `IdleOrRoam` method.
			ZombieCharacter->ToIdleState();
			GetWorld()->GetTimerManager().SetTimer(ChaseIdleTimer, this, &AZombieAIController::IdleOrRoam, ZombieCharacter->AfterChaseDelay, false);
		}
	}
	else
	{
		// Otherwise if there is no delay we can just go straight to the `IdleOrRoam` method.
		IdleOrRoam();
	}
}
```

So at this point if you save, compile, and press play you'll notice the ZombieCharacter roaming just like before but now if you get close enough in front of it, the ZombieCharacter will start chasing you until you get out of its vision range (which you can see by pressing the single quote key). If you left the PlayerCharacter and ZombieCharacter movement values to the defaults you should easily be able to run out of the ZombieCharacter's field of view and when you do the ZombieCharacter will stop and look at you and then after the `AfterChaseDelay`, it will go back to being idle or roaming.

You might notice that if you let the ZombieCharacter catch up to you and move, the ZombieCharacter will awkwardly run in place as it its still chasing you but it won't move. This is intended as it leaves room for the attack logic which we'll add next.

So to start setting up attacking, we'll need a `UBoxComponent` to act as a damage collider. If the PlayerCharacter is within this box then the ZombieCharacter will start attacking the PlayerCharacter and when the PlayerCharacter leaves the box then the ZombieCharacter will go back to chasing the PlayerCharacter.

**ZombieCharacter.h**

```cpp
// When the ZombieCharacter attacks we check to see if the PlayerCharacter
// is inside of this collider.
UPROPERTY(VisibleDefaultsOnly);
class UBoxComponent* ZombieDamageCollider;
```

And now we'll need to bind some methods to respond to a component entering and exiting the `DamageCollider` but we're going to do this in the ZombieAIController class because we want to handle all of the logic in there. Let's take a look at what we'll need:

- We need to create two methods: `OnComponentEnterDamageCollider` and `OnComponentEnterDamageCollider`. These methods will be bound to the `DamageCollider` to respond to when a component enters and leaves the `DamageCollider`.

- In the `OnComponentEnterDamageCollider` method we'll have to try to cast the `OtherActor` to our PlayerCharacter and if we can, then we know that the PlayerCharacter is in attack range so we call the `ToAttackState` method of the ZombieCharacter to make the attack animation play.

- In the `OnComponentLeaveDamageCollider` method we'll again have to try to cast the `OtherActor` to our PlayerCharacter and if we can, then we know that the PlayerCharacter has left attack range to we call the `Chase` method to make the ZombieCharacter to back to chasing the PlayerCharacter.

**ZombieAIController.h**

```cpp
/**
 * Called when an actor enters the ZombieCharacter's DamageCollider.
 */
UFUNCTION()
void OnComponentEnterDamageCollider(UPrimitiveComponent* OverlappedComp, AActor* OtherActor, UPrimitiveComponent* OtherComp, int32 OtherBodyIndex, bool bFromSweep, const FHitResult& SweepResult);

/**
 * Called when an actor leaves the ZombieCharacter's DamageCollider.
 */
UFUNCTION()
void OnComponentLeaveDamageCollider(UPrimitiveComponent* OverlappedComp, AActor* OtherActor, UPrimitiveComponent* OtherComp, int32 OtherBodyIndex);
```

In the cpp file we bind the above methods in the `OnPossess` method after we have the reference to our ZombieCharacter and then create the methods with the logic we discussed above:

**ZombieAIController.cpp**

```cpp
/**
 * Called when the ZombieAIController takes over the ZombieCharacter.
 *
 * @param ZombiePawn The ZombieCharacter pawn.
 */
void AZombieAIController::OnPossess(APawn* ZombiePawn)
{
	Super::OnPossess(ZombiePawn);

	// Attempt to cast the Pawn that was taken over to a ZombieCharacter and if
	// successful then we assign it to our `ZombieCharacter` variable.
	ZombieCharacter = Cast<AZombieCharacter>(ZombiePawn);

	// Bind the methods to respond to a component entering or exiting the ZombieCharacter's
	// DamageCollider component.
	ZombieCharacter->ZombieDamageCollider->OnComponentBeginOverlap.AddDynamic(this, &AZombieAIController::OnComponentEnterDamageCollider);
	ZombieCharacter->ZombieDamageCollider->OnComponentEndOverlap.AddDynamic(this, &AZombieAIController::OnComponentLeaveDamageCollider);
}

/**
 * Called when an actor enters the ZombieCharacter's DamageCollider.
 */
void AZombieAIController::OnComponentEnterDamageCollider(UPrimitiveComponent* OverlappedComp, AActor* OtherActor, UPrimitiveComponent* OtherComp, int32 OtherBodyIndex, bool bFromSweep, const FHitResult& SweepResult)
{
	// Try to cast the `OtherActor` to our `PlayerCharacter` and if we can then we
	// switch the ZombieCharacter to be in the ATTACK state.
	APlayerCharacter* PlayerCharacter = Cast<APlayerCharacter>(OtherActor);
	if (PlayerCharacter == nullptr) return;

	ZombieCharacter->ToAttackState();
}

/**
 * Called when an actor leaves the ZombieCharacter's DamageCollider.
 */
void AZombieAIController::OnComponentLeaveDamageCollider(UPrimitiveComponent* OverlappedComp, AActor* OtherActor, UPrimitiveComponent* OtherComp, int32 OtherBodyIndex)
{
	// Try to cast the `OtherActor` to our `PlayerCharacter` and if we can then we
	// switch the ZombieCharacter to be in the CHASE state since it means that the
	// PlayerCharacter is running away.
	APlayerCharacter* PlayerCharacter = Cast<APlayerCharacter>(OtherActor);
	if (PlayerCharacter == nullptr) return;

	Chase(PlayerCharacter);
}
```

Now if you save and compile this and press play, you can see that if you get the ZombieCharacter to chase you and then you let it catch you, the ZombieCharacter will start attacking you. Now if you get out of attack range of the ZombieCharacter you'll see that the ZombieCharacter goes back to chasing you until you either come in attack range again, or leave the sight radius.

## **Implementing the DEAD state**

Last thing we have to do is have implement the DEAD state and for this we're going to have to make the following additions:

- Add a `bIsDying` variable to the ZombieAnimInstance so that the animator knows when it should play the zombie death animation.

- Add a `Damage` variable to the PlayerCharacter to set how much damage the BulletActor should do. This is set here and in BulletActor because we want it to be editable and we don't have a great way of editing BulletActor variables without blueprints so we'll just have damage here which will be passed to the BulletActor when spawned. We also need to modify the `Fire` method so that we pass this damage to the BulletActor.

- Add a damage variable and modify the `OnBulletHitComponent` method of the BulletActor so that it checks whether the BulletActor hit a ZombieCharacter and if so it calls the `Hit` method on the ZombieCharacter.

- Create a variable for health and a `Hit` method on the ZombieCharacter that is used to deal damage to the ZombieCharacter and also check to see if it's dead in which case we un-possess the ZombieCharacter and call `Destroy` on the ZombieAIController so that it doesn't try to move the ZombieCharacter anymore. Notice that instead of a `Hit` method we could override the `TakeDamage` method but this is a very simple example so we'll just make something simple.

- Lastly we have to add the zombie dying state to the animation blueprint and make sure that this animation doesn't loop.

So now that we have that laid out for us, let's start by adding the `bIsDying` variable to the ZombieAnimInstance class:

**ZombieAnimInstance.h**

```cpp
// Indicates whether the ZombieCharacter is dying or not.
UPROPERTY(EditAnywhere, BlueprintReadOnly)
bool bIsDying;
```

And then in the cpp file we modify the `UpdateAnimationProperties` to include the `bIsDying` variable:

**ZombieAnimInstance.cpp**

```cpp
/**
 * Used by the animation blueprint to update the animation properties above
 * and decide what animations to play.
 */
void UZombieAnimInstance::UpdateAnimationProperties()
{
	// Try to get the Pawn being animated and return if a nullptr.
	APawn* ZombiePawn = TryGetPawnOwner();
	if (ZombiePawn == nullptr) return;

	// Try to cast the Pawn to our ZombieCharacter since that's the only
	// thing we want to animate.
	AZombieCharacter* ZombieCharacter = Cast<AZombieCharacter>(ZombiePawn);
	if (ZombieCharacter == nullptr) return;

	// Set the variables that are dependent on states.
	bIsRoaming = ZombieCharacter->State == ZombieStates::ROAM;
	bIsChasing = ZombieCharacter->State == ZombieStates::CHASE;
	bIsAttacking = ZombieCharacter->State == ZombieStates::ATTACK;
	bIsDying = ZombieCharacter->State == ZombieStates::DEAD;
}
```

Now let's head over to the PlayerCharacter and add our `Damage` variable that can be edited:

**PlayerCharacter.h**

```cpp
// The amount of damage each shot of the PlayerCharacter's gun does.
UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = Player)
float Damage = 10.f;
```

Now in the cpp file we modify the `Fire` method so we can pass this `Damage` variable to the BulletActor when it's spawned:

**PlayerCharacter.cpp**

```cpp
/**
 * Called when the Fire input action is pressed.
 */
void APlayerCharacter::Fire()
{
	// Return early if `GetWorld()` returns a nullptr.
	UWorld* const World = GetWorld();
	if (World == nullptr) return;

	const FRotator SpawnRotation = GetControlRotation();

	// Since the `BulletSpawnLocation` is in camera space, we have to transform it to
	// world space before offsetting it from the character location to find the final
	// bullet spawn location.
	const FVector SpawnLocation = ((BulletSpawnLocation != nullptr) ? BulletSpawnLocation->GetComponentLocation() : GetActorLocation()) + SpawnRotation.RotateVector(GunOffset);

	// Set Spawn Collision Handling Override.
	FActorSpawnParameters ActorSpawnParams;
	ActorSpawnParams.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AdjustIfPossibleButDontSpawnIfColliding;

	// Spawn the BulletActor and pass the `Damage` value over to it.
	ABulletActor* BulletActor = World->SpawnActorDeferred<ABulletActor>(ABulletActor::StaticClass(), FTransform::Identity, nullptr, nullptr, ESpawnActorCollisionHandlingMethod::AdjustIfPossibleButDontSpawnIfColliding);
	BulletActor->Damage = Damage;
	UGameplayStatics::FinishSpawningActor(BulletActor, FTransform(SpawnRotation, SpawnLocation, FVector(1.f, 1.f, 1.f)));

	// Get the animation object for the PlayerCharacter's body mesh and play the fire animation.
	UAnimInstance* AnimInstance = PlayerSkeletalMesh->GetAnimInstance();
	if (AnimInstance == nullptr) return;

	AnimInstance->Montage_Play(GunFireAnimation, 1.f);
}
```

Next we head on over to the BulletActor so we can add the `Damage` variable to it:

**BulletActor.h**

```cpp
// The damage this BulletActor should do.
UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
float Damage;
```

In the cpp file we have to try to cast what we hit to a ZombieCharacter since we only want to deal damage to that and if we can cast it then we'll call the `Hit` method of the ZombieCharacter passing in `Damage` which we'll create next.

**BulletActor.cpp**

```cpp
/**
 * Called when the BulletActor hits another component.
 */
void ABulletActor::OnBulletHitComponent(UPrimitiveComponent* HitComp, AActor* OtherActor, UPrimitiveComponent* OtherComp, FVector NormalImpulse, const FHitResult& Hit)
{
	// We want to return early if anything is null as it could cause a crash otherwise.
	if ((OtherActor == nullptr) || (OtherActor == this) || (OtherComp == nullptr)) return;

	// Cast the `OtherActor` to a `ZombieCharacter` if we can and call its `TakeDamage` method.
	AZombieCharacter* ZombieCharacter = Cast<AZombieCharacter>(OtherActor);
	if (ZombieCharacter == nullptr) return;
	ZombieCharacter->Hit(Damage);

	// Finally destroy the the BulletActor so we don't end up with a bunch of bullets that
	// litter the level and impact performance.
	Destroy();
}
```

Moving on we define the `Health` variable and `Hit` method for the ZombieCharacter:

**ZombieCharacter.h**

```cpp
// The amount of health the ZombieCharacter has.
UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = Zombie)
float Health = 100.f;
```

And then further down where we define the state methods:

```cpp
/**
 * Called to make the ZombieCharacter take damage and check to see if the
 * ZombieCharacter needs to die.
 */
void Hit(float Damage);
```

And in the cpp file we create the `Hit` method and in it we subtract the `Damage` from the `Health` and if the `Health` is now at or below 0, then we have the ZombieAIController un-possess the ZombieCharacter and then destroy it so that it won't try to move the ZombieCharacter any further:

**ZombieCharacter.cpp**

```cpp
/**
 * Called to make the ZombieCharacter take damage and check to see if the
 * ZombieCharacter needs to die.
 */
void AZombieCharacter::Hit(float Damage)
{
	// Take the damage to apply from the ZombieCharacter's damage.
	Health -= Damage;

	// If the ZombieCharacter's `Health` is at or below zero then we have take care of disabling the
	// ZombieAIController.
	if (Health <= 0.f)
	{
		// Have the ZombieAIController un possess the ZombieCharacter and then destroy the
		// ZombieAIController so it doesn't give any more input to the ZombieCharacter.
		AAIController* ZombieAIController = Cast<AAIController>(GetController());
		if (ZombieAIController == nullptr) return;
		ZombieAIController->UnPossess();
		ZombieAIController->Destroy();

		// Put the ZombieCharacter in the `DEAD` state so that the animation blueprint will play
		// the zombie dying animation.
		ToDeadState();
	}
}
```

Finally we just have to make sure to add the zombie dying animation to the animation blueprint and make sure that it doesn't loop. So in the animation blueprint just make a connection from every state to the dying state and set it to trigger when `Get Is Dying` is set to `true` like so:

![Zombie Animation Dying](../../images/aug/unreal-zombie-ai/zombie-animation-dying.png)

Now double click in this animation and in the settings on the right make sure that Loop Animation isn't ticked like so:

![Dying Animation No Loop](../../images/aug/unreal-zombie-ai/dying-animation-no-loop.png)

At this point if you save and compile and press play, you should be able to shoot the ZombieCharacter as many times as it needs to get to 0 health or lower and you should see the dying animation play and no further movement from the ZombieCharacter.

**Bonus**

As a bonus we'll go over how to destroy the ZombieCharacter after a period of time. To do this, we create a timer that runs for the length of the zombie dying animation and after that we can use `SetLifeSpan` to destroy the ZombieCharacter after a period of time like so:

**ZombieCharacter.h**

```cpp
// The amount of seconds long that the zombie dying animation is. This is used with
// the `SecondsAfterDeathBeforeDestroy` variable to make sure that the dying animation
// plays out fully before the ZombieCharacter is destroyed.
UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = DyingState)
float DyingAnimationLengthInSeconds = 3.f;

// The amount of time after the ZombieCharacter dies that they will destroy. A value
// of 0 means that the ZombieCharacter will be destroyed immediately after the dying
// animation plays. A value below 0 means that the ZombieCharacter will never be destroyed.
UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = DyingState)
float SecondsAfterDeathBeforeDestroy = 5.f;

protected:
	/**
	 * The timer used to wait until the dying animation has finished playing.
	 */
	FTimerHandle DeathAnimationTimer;

protected:
	/**
	 * Called after the death animation finishes playing.
	 */
	void AfterDeathAnimationFinished();
```

And then in the cpp file we set the timer to run after the ZombieAIController has been destroyed and we create the `AfterDeathAnimationFinished` method that the timer runs when finished to destroy the ZombieCharacter:

**ZombieCharacter.cpp**

```cpp
/**
 * Called to make the ZombieCharacter take damage and check to see if the
 * ZombieCharacter needs to die.
 */
void AZombieCharacter::Hit(float Damage)
{
	// Take the damage to apply from the ZombieCharacter's damage.
	Health -= Damage;

	// If the ZombieCharacter's `Health` is at or below zero then we have take care of disabling the
	// ZombieAIController.
	if (Health <= 0.f)
	{
		// Have the ZombieAIController un possess the ZombieCharacter and then destroy the
		// ZombieAIController so it doesn't give any more input to the ZombieCharacter.
		AAIController* ZombieAIController = Cast<AAIController>(GetController());
		if (ZombieAIController == nullptr) return;
		ZombieAIController->UnPossess();
		ZombieAIController->Destroy();

		// Put the ZombieCharacter in the `DEAD` state so that the animation blueprint will play
		// the zombie dying animation.
		ToDeadState();

		// Now we set a timer for the length of the dying animation to make sure that if we have to
		// destroy the ZombieCharacter, we don't do it until the animation has finished playing.
		UWorld* World = GetWorld();
		if (World == nullptr) return;
		World->GetTimerManager().SetTimer(DeathAnimationTimer, this, &AZombieCharacter::AfterDeathAnimationFinished, DyingAnimationLengthInSeconds);
	}
}

/**
 * Called after the death animation finishes playing.
 */
void AZombieCharacter::AfterDeathAnimationFinished()
{
	// Now that the dying animation has finished playing we can see if we need to Destroy
	// the ZombieCharacter.
	if (SecondsAfterDeathBeforeDestroy == 0.f)
	{
		// The ZombieCharacter should be destroyed immediately so we don't need to set a
		// timer.
		Destroy();
	}
	else if (SecondsAfterDeathBeforeDestroy > 0.f)
	{
		// We have to wait some time before the ZombieCharacter should be Destroyed so we
		// set a timer that runs the method to destroy the ZombieCharacter.
		SetLifeSpan(SecondsAfterDeathBeforeDestroy);
	}
}
```

## **Conclusion**

With the above setup you should be able to even group ZombieCharacter together and form hordes and and when the PlayerCharacter gets close they'll attack at the same time. I might expand on this tutorial in the future to make it into a series about developing a modern survival style game. Thank you for reading and be sure to the check out the [repo](https://github.com/robertcorponoi/unreal-zombie-ai) for a full example.
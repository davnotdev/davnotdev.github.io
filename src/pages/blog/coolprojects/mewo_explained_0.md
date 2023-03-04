---
layout: ../../../layouts/BlogLayout.astro
---

# \# Mewo Explained [0] ~ 3/3/2023

> You can watch Mewo evolve [on Github](https://github.com/davnotdev/mewo)

Mewo is an ECS game engine I'm working on right now, following in the footsteps
of Bevy and Godot.
It's goal: to be big enough to be useful but small enough to be easily understandable.
Mewo currently build in Rust.

But David!
You're 16, why waste your life away building a game engine?
Go build a website or a game or whatever kids build nowadays.

Well, originally, I started building game engines because I thought that I
could do better.
My laptop was simply to slow to run Unity.
Of course, I've learned over the years that I definitely can't do better than
Unity especially at a macro level, but then again, is that really the point?
Building Mewo and my other failure game engine projects has helped me gain an appreciation
for the existing game making tools out there that we all take for granted.
Everyone likes to roast engines like Roblox or whatever engine was used for
Fallout 76, but you have to admire the engineering horsepower and the hours
people have put in to create them.
Oh, almost forgot.
It's just a lot of fun!

Anyway, I should probably elaborate some more on what I'll be talking about here.
The article this is called "Mewo Explained [0]" because Mewo is designed to
be modular.
Rather than being one big blob, Mewo is composed of it's core ECS called
`mewo_galaxy` and supported by other `std` crates.
`mewo_galaxy` is almost entirely dependency free, but by itself, it cannot do
physics, rendering, or anything else we expect from
game engines.
Rather, it gives the building blocks to implement these features.
Today, I will only talk about `mewo_galaxy`.
Though I will warn that `mewo_galaxy` is currently about 30% of the entire codebase.
I'll also be assuming that you have some knowledge of game engines as well as
some basic computer science and C/C++.
What I mean is that if you've dabbled in Unity
before as well as some C/C++, my words shouldn't be complete gibberish.
Onwards we go!

> I apologize in advance for the boring wall of text coming up.
> I'll do my best to make it interesting.
> (If that's even possible.)

## \#\# The Big Picture

Before writing any code for anything, it's always important to know the problem
before finding the solution.
In Mewo's case, it's important to lay out what the user will see when using Mewo.

```rust

#[derive(Component)]
struct Player;
#[derive(Component)]
struct Heath(usize);

#[derive(Event)]
struct ThePlayerIsDeadEvent;

#[derive(Resource)]
struct SomeTexture;

fn game_init(galaxy: &Galaxy) {
    //  Create our player.
    let player = galaxy.insert_entity()
        .insert(Player)
        .insert(Heath(100))
        .get_entity();

    let grass_texture = "assets/grass.png";
    galaxy.insert_resource(grass_texture, SomeTexture::load(grass_texture));
}

fn game_player_dec_health_update(galaxy: &Galaxy) {
    //  Decrease player's health.
    for health in galaxy.query::<&mut Health>().with::<Player>().iter() {
        health.0 -= 1;

        //  Announce that the player has died.
        if health == 0 {
            galaxy.insert_event(ThePlayerIsDeadEvent);
        }
    }
}

#[derive(GalaxyState)]
enum GameState {
    MainMenu,
    DeathScreen,
}

fn game_player_dead_update(galaxy: &Galaxy) {
    //  Has the player died?
    for _ in galaxy.get_events::<ThePlayerIsDeadEvent>() {
        galaxy.set_state(state(GameState::DeathScreen));
    }
}

fn main() {
    let mut galaxy: Galaxy::new();

    init(&galaxy);

    galaxy.update();

    loop {
        game_player_dec_health_update(&galaxy);
        game_player_dead_update(&galaxy);
        galaxy.update();
    }
}
```

Woah, there's a lot to unpack here, so I'll go some of the terminology.

- Galaxy: The user facing API of `mewo_galaxy`
- Entity: A game object that may hold Components
- Component: Some piece of data
- Resource: A piece of data not associated with an entity but rather a unique value
- Event: A piece of data that can be emitted and listened to
- State: Any value representing the current state of the game

Together, `mewo_galaxy` makes up an ECS.

## \#\# What is ECS?

Wait, you've mentioned that Mewo is an "ECS game engine", but what does that
even mean?
Well, it would first be appropriate to define that an ECS is, and to understand
ECS, you need to understand the problem it solves.
You have game objects (called entities) and components (like `Transform`,
`Rigidbody`, etc).
However, you need some way to store and access them in memory.
The naive approach is to do something like this:

> I'm using C++ here because my first ever attempt at building a game engine
> looked something like this.

```cpp

class Component {
public:
    virtual void Init() = 0;
    virtual void Update() = 0;
};

class Entity {
public:
    std::vector<Component*> components;
};

class GameEngine {
public:
    std::vector<Entity> entities;
};

```

This looks fine, but it suffers from two big flaws: iteration performance and
the overall mental model.

### \#\#\# Iteration Performance

Let's say you want to create a `GravitySystem` that moves all `Transform`
components downward. That would look like this

```cpp

for (int eidx = 0; eidx < entities.size(); eidx++) {
    auto entity = entities.at(eidx);
    for (int cidx = 0; cidx = entity.components.size(); cidx++) {
        auto component = entity.components.at(cidx);
        if (component.IsComponent<Transform>()) {
            auto transform = static_cast<Transform>(component);

            //  Finally do the transform.

        }
    }
}

```

And no, time complexity is not the issue here.
It's the memory.
The vector of entities means a separate heap allocation which then contains a list
of components: yet another heap allocation, and then another since `Component`
is an interface!
The CPU has to essential jump through three pointers for each iteration of the
`Transform` component!
This game of Where's Waldo is terrible for the CPU because of CPU caching which
I'll get into later.

### \#\#\# Mental Model

Let's be real, performance does not matter in most cases, especially for hobby projects.
What is important is the mental model.
I won't pretend that I'm an expert here, so here are the reasons I've picked up
thus far:

- Object Oriented Programming (especially inheritance) is bad (\*)
- Mixing state and functionality
- Harder to reason with after scaling

> \* Ha ha, please don't murder me.

### \#\#\# So What is ECS?

An ECS (Entity Component System) is not very well defined, but typically, it's
a data oriented pattern that uses separates the traditional notion of a
component into it's data (the component) and it's functionality (the system).
Entities are just a identifier number, basically making them irrelevant.
They are just shells for the components they hold, and by treating those
components as simple data, code is expressed as a simple data transformation.

```rust

struct Entity(usize);

struct ECS {
    entities: Vec<Entity>,
    transforms: Vec<Transform>,
    colliders: Vec<Collider>,
    other_components: Vec<OtherComponent>,
}
```

Here's an excerpt from the Bevy ECS:

```rust
// This system updates the score for each entity with the "Player" and "Score" component.
fn score_system(mut query: Query<(&Player, &mut Score)>) {
    for (player, mut score) in &mut query {
        let scored_a_point = random::<bool>();
        if scored_a_point {
            score.value += 1;
            println!(
                "{} scored a point! Their score is: {}",
                player.name, score.value
            );
        } else {
            println!(
                "{} did not score a point! Their score is: {}",
                player.name, score.value
            );
        }
    }

    // this game isn't very fun is it :)
}
```

It's very clear here, that you are taking every entity with both a `Player` and
`Score`, then adding one based on the random boolean.

Since components are treated like separate pieces of data, we can
capitalize on the ease of tracking accesses by using multithreading.
On top of that, since we no longer have a heap allocation from each component,
we can benefit from CPU caching.

> I wrote **an** `std` because I pronounce `std` as "es tee dee".
> I wonder how others pronounce it.

### \#\#\# Quick Section About CPU Caching

Essentially, the CPU doesn't actually read data from RAM one byte at a time like
C would make you think.
Rather, it pulls data in one cache line (usually 64 bits) at a time.
This data is then dumped into L3 cache and saved for later.
If the CPU is running a for loop let's say on data that is within the same cache
line, this is called a cache hit.
The CPU doesn't have to travel all the way back to RAM to fetch data, it can
take it from cache instead.
However, if the CPU gets a pointer like in the case of our
`std::vector<Component*>`, the CPU has to trudge all the way back to RAM
**for each** iteration.
This is called a cache miss.
This is why an `std::vector<Transform>` will always be faster than an `std::vector<Component*>`.

### \#\#\# Archetype ECS

Where a traditional ECS stores components in lists based on types, an archetypal
ECS stores components along with other components it's parent entity stores.

```rust
struct ABC {
    a: Vec<A>,
    b: Vec<B>,
    c: Vec<C>,
}

//  Entity of archetype ABC.
Entity()
    .add(A)
    .add(B)
    .add(C);

struct ABD {
    a: Vec<A>,
    b: Vec<B>,
    d: Vec<D>,
}

//  Entity of archetype ABD.
Entity()
    .add(A)
    .add(B)
    .add(D);
```

This system makes multithreading much easier to track.
For example, if you want to lock all components with component `A` and `B`,
not all components of a component type would be locked.

```plaintext
l = locked
u = unlocked

# Component Type Storage

             l   u   l   u
A:         | 2 | 3 | 4 | 5 |
     u   u   l       l
B: | 0 | 1 | 2 |   | 4 |

# Component Archetypal Storage

## Archetype AB
- - - - - - - l - - - - - - -
A: | 0 | 1 | 2 | 3 | 4 | 5 |
- - - - - - - l - - - - - - -
B: | 0 | 1 | 2 | 3 | 4 | 5 |

## Archetype ABC
- - - - - - - l - - - - - - -
A: | 0 | 1 | 2 | 3 | 4 | 5 |
- - - - - - - l - - - - - - -
B: | 0 | 1 | 2 | 3 | 4 | 5 |
- - - - - - - u - - - - - - -
C: | 0 | 1 | 2 | 3 | 4 | 5 |
```

As you can see here, rather than having to track the accesses of each component index,
we can lock entire component rows since each `ABC` and `AB` must have a full row
`A` and `B`.

Of course, this archetypal storage method has performance downsides as well.
Specifically, the adding and removing components from entities is much less
performant because of archetype transfers.
If I add component `C` to an entity with the archetype `AB`, the entity no
longer fits in `AB` and must be transferred to `ABC`.
This extra copying is not needed in a component type based storage method.

> Much more detailed description of archetypal ECS [here](https://ajmmertens.medium.com/building-an-ecs-2-archetypes-and-vectorization-fe21690805f9).

### \#\#\# Ok, So What is an "ECS Game Engine"

Big engines like Unreal and Unity have begun to take advantage of the ECS
pattern for performance reasons.
However, the core of these engines are below the ECS.
In other words, these engines start with some primitive functionality and build
an entity component system on top of that.
Mewo and Bevy both build an entity component system, **then** build systems on
top of that.
That way, you get to leverage the performance benefits of ECS at the lowest level.

> I've mentioned this over and over, but in the Rust world, [Bevy](https://bevyengine.org/)
> would be the textbook example of an ECS game engine.

## \#\# Mewo's Implementation

### \#\#\# The Raw ECS

Raw ECS?
How is this different from a cooked ECS or a medium rare ECS?
Well, originally, Mewo was meant to have language support for both Rust and C.
There would be a language agnostic backend which would then be used by a Rust
frontend, a C frontend, and whatever other language I wanted to add.
While this does sound impressive and is possible in theory, properly supporting
multiple languages is a massive pain, so the idea was scrapped.
However, remnants of this idea are still found in Mewo.
Today, there is the raw ECS as well as the user facing ECS.
In more _design pattern_-y terms: The internal, ugly functionality of the entity
component system (called the raw ECS) is then abstracted away by a pretty facade.

### \#\#\# Get to Know Your Planets

And no, I'm not talking about the planets they taught you in the 4th grade.
Originally called "Managers", planets are mostly independent pieces that manage
the internal state of the engine.
Let's have a look at them!

- `ComponentTypePlanet`
- `ComponentGroupPlanet`
- `EntityPlanet`
- `EventPlanet`
- `StoragePlanet`
- `StatePlanet`
- `ResourcePlanet`
- `QueryPlanet`

> TODO
> Road Work Ahead!

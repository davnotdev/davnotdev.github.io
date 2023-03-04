---
layout: ../../../layouts/BlogLayout.astro
---

# Mewo Explained [0]  ~ 3/3/2023

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
Oh, and it's just a lot of fun!

Anyway, enough of that, let's get into the design details.
Since Mewo is constantly evolving, I'll be talking about `mewo_galaxy`, one
piece that shouldn't have any major changes anymore (hopefully). I'll be
assuming that you have some knowledge of game engines as well as some basic
computer science and C/C++. What I mean is that if you've dabbled in Unity
before as well as some C/C++, my words shouldn't be complete gibberish.

> I apologize in advance for the boring wall of text coming up.
> I'll do my best to make it interesting.

## Raw ECS: The Core of the Operation

Raw ECS?
The heck is that and how does it differ to a cooked ECS or a medium rare ECS?
Actually, what even is an ECS?

Well, to understand ECS, you need to understand the problem it solves.
You have game objects (called entities) and components (like `Transform`,
`Rigidbody`, etc).
However, you need some way to store then in memory and access them.
The naive approach is to do something like this:

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

### Iteration Performance

Let's say you want to create a `GravitySystem` that moves all `Transform`
components down. That would look like this

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
The list of entities means a separate heap allocation which then contains a list
of components: yet another heap allocation, and then another since `Component`
is an interface!
This game of Where's Waldo is terrible for the CPU, and I'll into specifically
why later.

### Mental model

Let's be real, performance does not matter in most cases, especially for hobby projects.
What is important is the mental model.
I won't pretend that I'm an expert here, so here are the reasons I've picked up:

- Object Oriented Programming (especially inheritance) is bad (*)
- Mixing state and functionality
- Harder to reason with after scaling

> \* Ha ha, please don't murder me.

### So What is ECS?

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
Essentially, when data is packed together in a list, the CPU can take all the
data at once without having to bounce around with pointers.
This is why an `std::vector<Transform>` will always be faster than an `std::vector<Component*>`.

> I wrote **an** `std` because I pronounce `std` as "es tee dee".
> I wonder how others pronounce it.

Ok, one more thing.
What does "raw" mean.
Originally, Mewo was designed to run both with rust and C.
However, Getting interop with C was far too straining on the rust side.
The idea was scrapped, but much of the code still reflects this in one way or other.

### Archetype ECS

> TODO

## The Less Raw ECS: What the User Sees

> TODO
> Road Work Ahead!

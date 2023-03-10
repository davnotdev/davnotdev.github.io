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

Why do I enjoy this?
Well, it's just a lot of fun!
Although I do feel sometimes that I'm wasting my time, I do find that the skills
I've obtained with these type of projects do translate to actual programming and
problem solving skills.
Also, building Mewo and my other failure game engine projects has helped me gain
an appreciation for the existing game making tools out there that we all take
for granted. Everyone likes to roast engines like Roblox or whatever engine was
used for Fallout 76, but you have to admire the engineering horsepower and the hours
people have put in to create them.

Anyway, I should probably elaborate some more on what I'll be talking about here.
The article this is called "Mewo Explained [0]" because Mewo is designed to
be modular.
Rather than being one big blob, Mewo is composed of it's core ECS called
`mewo_galaxy` and supported by other `mewo_std` crates.
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

## \#\# Mewo's Implementation (The Raw ECS)

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
The code for this is held in the [`ecs` folder](https://github.com/davnotdev/mewo/tree/main/galaxy/src/ecs).

### \#\#\# Deferring Insertions

One difficult problem all game engines face is ordering.
Certain systems must come after certain other systems because of events.
If my game code runs before my input code, my game code won't be aware of new
keyboard inputs.
More problems arise with an archetypal ECS solution.
Every time an entity gets a component added to it, it must transfer archetypes.
This is an operation requires mutability and essentially freezes those storages
for a bit.
Instead of freezing in the middle of the frame, we can defer the insertions of
events, entities, and components to the end of the frame.
Not only is this simpler, but it also opens the door for additional optimization
opportunities.

### \#\#\# Get to Know Your Planets

And no, I'm not talking about the planets they taught you in the 4th grade.
They should be called "Managers", and if you look back at the commit history,
that is what they were called, but I got bored of typing "Manager" over and over.
Anyway, planets are mostly independent pieces that manage
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

Ok, some of these are pretty straight forward.
`StatePlanet`, `ResourcePlanet`, and `EventPlanet` are dead very simple.
They do exactly what their names suggest, and if you want more elaboration, just
[look into the code](https://github.com/davnotdev/mewo/tree/main/galaxy/src/ecs).
You could skim them considering that none of these planets exceed 100 lines of code.

### \#\#\# Generational Indices

I want to take a moment to talk about `EntityPlanet` because of generational indices.
If you are building a game engine and you haven't heard of generational indices,
[read about them right now](https://lucassardois.medium.com/generational-indices-guide-8e3c5f7fd594)!

Let's say I have an entity `EntityId(88)`.
If I store that entity and someone else decides to delete `EntityId(88)`, my
stored entity is now invalid.
But, someone could create a new `EntityId(88)` while I still think my `EntityId(88)`
is still valid.
This will lead to some unimaginably stupid bugs.

Generational indices basically puts another number into the `EntityId` that
increments with every new generation, hence the name.
Now, my entity is `EntityId(88, 0)`.
If the same happens and a new entity is born, this new entity would be of id
`EntityId(88, 1)`, one generation up from mines.

I absolutely love solutions like this one.

### \#\#\# Component Planets

You may have noticed that there are two planets for components, and there is a
good reason for this.
`ComponentTypePlanet` is most simple, storing a map of component types and how
to safely clone and free them.
Each component gets a `ComponentTypeId` which is actually a hash derived from
its type (`std::any::TypeId` essentially).
A `ComponentGroupPlanet` holds `ComponentGroup`s which in turn hold a list of `ComponentTypeId`s.
You can essentially think of a `ComponentGroup` as an archetype.
These groups are identified by a `ComponentGroupId`.
Now, the only trick with `ComponentGroup`s is that their inner `ComponentTypeId`s
are always sorted.
To explain why, we must look at the classic ABBA problem.

```plaintext
Archetype AB
A: | 0 | 1 | 2 | 3 | 4 | 5 |
B: | 0 | 1 | 2 | 3 | 4 | 5 |
```

Let's thread #1 decides to take the lock of AB.
It cannot do this in one go.
Rather, it must first take A, then B.
This means that if thread #2 tries to take BA, there is a small chance that
thread #1 locks A while thread #2 locks B.
Now, thread #1 sees that B is locked and waits.
However, thread #2 sees that A is locked and waits, causing a deadlock.
By having components be sorted, access will always come in the order of AB or ABC.
Since locks are taken in one direction only, there can never be a deadlock.

```plaintext
Archetype AB
A: | 0 | 1 | 2 | 3 | 4 | 5 |
B: | 0 | 1 | 2 | 3 | 4 | 5 |

Archetype BA
B: | 0 | 1 | 2 | 3 | 4 | 5 |
A: | 0 | 1 | 2 | 3 | 4 | 5 |
```

Sorting also makes it impossible for there to be two archetypes that have the
same components as shown above.

### \#\#\# Storage Planet

`StoragePlanet` is the bulk of the system.
All it does is store the actual components with the archetypal storage method.
On the surface, it's pretty simple:

```rust
#[derive(Debug)]
pub struct StoragePlanet {
    null_group: ComponentGroupId,
    storages: SparseSet<ComponentGroupId, StorageBloc>,
    entities: SparseSet<Entity, ComponentGroupId>,
}
```

When `StoragePlanet` is created, `null_group` is registered for entities that
don't have any components.
All newly spawned components will start out in this group.
The `storages` and `entities` fields are also pretty self explanatory.
Inserting, removing, or moving (to another archetype) entities can be done with
a `StorageTransform`.
During transformation, if the `StoragePlanet` finds a new `ComponentGroupId`,
it will both create a new archetype itself and inform the `QueryPlanet`.

Each archetype has its own `StorageBloc` which is defined as the following:

```rust
//      DVec    DVec    DVec
//  e   d       d       d
//  e   d       d       d
#[derive(Debug)]
pub(super) struct StorageBloc {
    datas: Vec<(ComponentTypeId, StorageRow)>,
    entities: Vec<Entity>,
}
```

A `DVec` is essentially a `std::vec::Vec` sans generics.
In this case, each component type has it's own `DVec`, or here it's wrapped by a
`StorageRow`.
Well, I guess `StorageRow` should actually be called `StorageColumn`.
The reason why we don't use DVec directly is because of copy price.

### \#\#\# Copy Price and Storage Rows

Have a peek into `mewo_galaxy_derive`, and you'll find derives with funny names
like `CheapComponent` and `UniqueComponent`.
In Rust, there are two methods of copying data `Clone` and `Copy`.
`Copy` is for objects that can be safely copied byte for byte i.e. `memcpy`.
`Clone` if for objects that involves pointer and require the invocation of a
copy constructor.
I've observed that most components in games are actually `Copy`.

Well, we can actually take advantage of this for more threading performance.
You see, when using a read-write lock, there can only be ONE writer at a time.
This means that all readers get blocked until the write finishes.
`StorageRow` has two types: `StorageRow::Normal` for `Clone` components and
`StorageRow::CopyCat` for `Copy` components.
Where the former holds a singular `DVec` normally, the latter hold two: one for
readers and one for writers.
At the end of every frame, the writer's data is copied into the reader's.
These copies are cheap because our component is `Copy`!
With this setup, readers can read whenever even when there is a writer.

### \#\#\# Access Logic with `QueryPlanet`

When we query for components like so: `query::<&mut Transform>().with::<Player>()`,
we don't want to constantly search `StoragePlanet` every time.
Rather, it would be more efficient to cache these results.
These results can then be accessed with a `QueryId`.
Currently, the following queries and filters are allowed

```rust
#[derive(Debug, Clone, Copy, Hash, PartialEq, Eq)]
pub enum QueryAccessType {
    Read,
    Write,
    OptionRead,
    OptionWrite,
}

#[derive(Debug, Clone, Copy, Hash, PartialEq, Eq)]
pub enum QueryFilterType {
    With,
    Without,
}
```

> `OptionRead` and `OptionWrite` is essentially `query::<Option<&mut Transform>>()`.

The only bit to note is how `QueryPlanet` updates.
When a unrecognized group is added, `QueryPlanet` will inform `StoragePlanet`,
before updating.
If a new component group is added, all previous queries must be updated.
If I have a query for `A`, and a new archetype `ABC` is created, `A` should also
match `ABC`.

### \#\#\# That's Pretty Much All

Wow, you made it all the way here.
Please give yourself a pat on the back.
We are almost there, just keep reading!

## \#\# Logging Interlude

Knowing what's wrong with your code is very very important, so Mewo features a
global logging solution.
My issue with many logging systems is how logs often get squished together.
Mewo uses folds to solve this.

```rust
fn my_system() {
    mfold!("my_system");
    {
        mfold!("Block A");
        merr!("All OK!");
    }
    {
        mfold!("Block B");
        merr!("Something blew up!");
    }
}
```

Mewo also has separate channels depending on the thread.

## \#\# What the User Sees

I've been talking about planets and ids and all these boring implementation
details, but we have yet to see the APIs that users will actually interact with.
The code for this is held in the [`galaxy` folder](https://github.com/davnotdev/mewo/tree/main/galaxy/src/galaxy).
This is really just one big type: the `Galaxy`.

```rust
pub struct Galaxy {
    ep: RwLock<EntityPlanet>,
    ctyp: RwLock<ComponentTypePlanet>,
    cgp: RwLock<ComponentGroupPlanet>,
    rcp: RwLock<ResourcePlanet>,
    evp: RwLock<EventPlanet>,
    qp: RwLock<QueryPlanet>,
    sp: RwLock<StoragePlanet>,
    stp: StatePlanet,

    ev_modify: ThreadLocal<EventModify>,
    st_transforms: ThreadLocal<Vec<StorageTransform>>,
}
```

`Galaxy` literally just holds all the planets.
The `ev_modify` and `st_transforms` is just the deferred insertions that I
mentioned earlier.
`Galaxy::update` is called to "flush" these insertions.

> Yes, yes, I know, it should be called a "star system" instead.

### \#\#\# Maybe Insert

If you poke around with the code, you may see the term `maybe_insert` sprinkled everwhere.
To understand this, we must go back in time.

```rust
fn plugin(pb: PluginBuilder) -> PluginBuilder {
    pb.comp::<Player>()
        .comp::<Obsticle>()
        .comp::<Collider>()
        .event::<ObsticleColliderCheckEvent>()
        .resource::<ObsticleSpawnTimer>()
        -- snip --
        .sys(game_collider_send)
        .sys(game_collider_check)
    ;
}

```

I couldn't find an extreme case, but this is a very old version of Mewo.
Both before and now, the ECS requires you to declare all component types, event
types, etc.
Because of this, past versions had you declare each and every component, event,
and resource you used.
If you didn't you'd get a weird and confusing error somewhere later.
As you can imagine, this is simply stupid, so the solution right now is to try
to insert the type anyway at every call to the ECS.
For example:

```rust
pub fn insert_resource<R: Resource, RH: Clone + Hash + 'static>(&self, rh: RH, r: R) -> &Self {
    let id = hash_resource_id(rh.clone());
    self.resource_maybe_insert::<R, RH>(rh);
    --- snip ---
    self
}
```

### \#\#\# Magic Query

The querying code is the most complex, and it makes me uncomfortable reading it.
First of all, there are access traits like the following:

- `ComponentAccessesNormal`: `(A, B, C)`
- `ComponentAccessesOptional`: `(Option<&A>, &mut B)`

I put the use cases that these access traits are implemented for above for more context.
`ComponentAccessesNormal` is used where having a `&` or `&mut` makes no sense,
specifically when doing `.with::<SomeComponent>()` or `.without::<SomeComponent>()`.
`ComponentAccessesOptional` is used for `.query::<&SomeComponent>()`.

Like I said, I don't like looking at the query code.
All I'll say is that the query then locks and obtains lists of pointers from `StorageRows`s.
The access traits handle the rest.

### \#\#\# The Everything Else

```plaintext
   +---------------+
   |.-------------.|
   ||             ||
   || Contruction ||
   ||    Ahead    ||
   ||             ||
   |+-------------+|
   +-..---------..-+
   .---------------.
  / /=============\ \
 / /===============\ \
/_____________________\
\_____________________/
```

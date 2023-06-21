---
layout: ../../../layouts/BlogLayout.astro
title: "Vulkan's Big Picture"
description: "Vulkan: The Big Picture. Explains the concepts of Vulkan in a simple manner."
---

# Vulkan: The Big Picture

> This is a WIP piece.

I started out with Vulkan about a year ago, but I only started understanding it
a few months when I began work on [mepeyew](https://github.com/davnotdev/mepeyew)
(A project that you should definitely checkout).
Vulkan is hard, and although amazing tutorials exist out there, they backtrack a lot.
Today, I'm going to give you the big picture of Vulkan.
I'll try to be as brief as possible and keep code to a minimum.
Then, I'll point you to the resources that helped me learn all of this.
With that said, let's get started.

> Note that I expect you to already have basic graphics programming knowledge.

## What is Vulkan?

Vulkan is a graphics API.
Actually, scratch that.
Vulkan is a GPU API.
Although Vulkan is designed for graphics programming first, it also supports
compute and other functions of the GPU.
Be warned that Vulkan is very *very* explicit.
Almost everything must be configured as there are no defaults.
In my opinion, this is the factor that scares off beginners.
For this reason, I'm going to skip most of the setup code and start at there
important concepts.

## The Rendering Pipeline

So what even is rendering?
And more importantly, how are we meant to think of it?

Well, rendering is just one or more pipelines.
As input, these pipelines take in vertex data (data describing the vertices of the
rendered object), uniform data (any data that can change per frame), and textures.
Through multiple stages, the pipeline processes this data and out comes a texture
on the other end.
Then, this texture is either put onto the screen or fed into another pipeline.

### Shaders

Shaders are snippets of code that are run within the pipeline.
There are two shader stages you should care about: vertex and fragment shaders.
Vertex shaders allow you to process data regarding each vertex of the shape you
are drawing while fragment shaders relate to the processing of individual pixels.

### SPIR-V

The design of GPUs differ greatly from CPUs, so in order to write shaders, you
need to use special shader programming languages.
Most other graphics APIs have their own respective languages, and Vulkan has none.
Well, Vulkan has SPIR-V which isn't really a language.
Rather, it's more of an assembly language, designed for the machines and not of the
humans.
Of course, you can write it by hand [(which I have a article about if you are interested)](/blog/tutorials/guide_spirv),
but considering it's arcane nature, nobody actually does.
SPIR-V is meant to be the compile target of other languages.
The most common shading language for Vulkan is [GLSL](https://en.wikipedia.org/wiki/OpenGL_Shading_Language).

### Pipeline

The graphics pipeline is a massive object in Vulkan, containing almost all of
the options you could possibly want while rendering.
Creating a graphics pipeline feels more like filling in a form rather than coding.
The graphics pipeline configures everything from depth and stencil to primitive
topology and blending.
In order to optimize, Vulkan wants know everything ahead of time meaning that
if you want to change some of these options, you will either need to recreate
the pipeline or use multiple pipelines.
Thankfully, some options can be made dynamic meaning that you can change them
later during rendering.
The most important dynamic option is the viewport which changes whenever your
window resizes.
Of course, other options like your scissor can also be made dynamic.

Finally, I need to mention the pipeline layout which describes the uniform data
used in the pipeline.
I will talk about this later.

## Memory

Similar to `malloc` and `free` in C, Vulkan requires you to manage your own memory.
However, unlike C, proper Vulkan memory management is a bit more complex, and
optimization further complicates the matter.
Thankfully plenty of clever people have already solved this issue.
When using Vulkan with C or C++, I'd recommend using [VMA](https://gpuopen.com/vulkan-memory-allocator/).
If you are on Rust, I'd recommend using [gpu-allocator](https://github.com/Traverse-Research/gpu-allocator).
Both libraries have worked flawlessly in my experience.

### Vertex Data

When I say "Vertex Data", I'm referring to vertex buffers and index buffers which
define the vertices of the rendered object.
As you may know, this includes, coordinates, colors, UV coordinates, and more.

In Vulkan, buffers live in many different places.
Some live only in GPU memory while other live in CPU memory.
There are even buffers that live on the border of the two, but they do not
apply here.
CPU buffers can be "mapped" into CPU memory meaning that our code can access it
directly.
GPU buffers cannot be mapped, and CPU GPU border buffers can be.

> "CPU GPU border buffer" is a term that I made up.

In the case of vertex and index buffers, you want to create both a GPU and CPU buffer.
As you cannot transfer data straight into GPU buffer, the typical convention is to
first transfer data into the CPU buffer, called the staging buffer.
Then, you use commands to copy this CPU buffer into the GPU buffer.
I'll talk about commands later.

## Descriptors

When sending other forms of data (non-Vertex Data) to the GPU, you need a descriptor.
Descriptors essentially point the GPU to the location of various resources.
Descriptors are organized into descriptor sets.
In order to keep data flowing efficiently, Vulkan allows you to use multiple
sets of data.
Ideally, data should be placed into these sets based on bind frequency.
However, note that the max number of sets bound at a time is finite.
Currently, I would consider it safe to bind up to 32 descriptors as more than 58% of platforms
support this.
This should increase going forward.

### Storage and Uniform Buffers 

Uniform buffers are where we store data that will can be changed per frame.
In Vulkan, uniform buffers are just ordinary buffers that we point to using
a descriptor.
Though, unlike our vertex and index buffers, uniform buffers should ideally be
stored in CPU GPU border buffers since we plan to update it every frame anyway.

Considering that CPU GPU border buffer areas are typically limited in terms of
memory, storage buffers are almost identical to uniform buffers, except that they
are stored in GPU memory.
Because of this, they will require a staging buffer for transfers.

### Padding

If you have written C or C++ for long enough, you'd probably know about padding.
It's nice to think of a `struct` as a packed list of bytes, but for performance
reasons, that not always the case.

```c
typedef struct {
    uint8_t a;
    uint32_t b;
} A;

sizeof(A) == 8
```

The reason why `A` is of size 8 and not 5 is because of the `uint32_t`.
The `uint32_t` wants to live on in memory 4 byte aligned.
`uint8_t` is 1 byte aligned, so since it doesn't meet this requirement,
the compiler sneakily pads the structure like so:

```c
typedef struct {
    uint8_t a;
    uint8_t _1;
    uint8_t _2;
    uint8_t _3;
    uint32_t b;
} A;
```

If it weren't padded like this, the program would either run slower or crash
entirely.

For uniform and storage buffers, Vulkan has alignment requirements as well
[which you can find here](https://registry.khronos.org/vulkan/specs/1.3-extensions/html/chap15.html#interfaces-resources-layout).
I would explain further, but [this article does a much better job explaining than I ever could](https://fvcaputo.github.io/2019/02/06/memory-alignment.html).

> Ok, padding isn't something that you need to know to see the big picture.
> I just mentioned it here so that you can keep this in mind.

## Images

I talked all about memory in the form of buffers, but I have yet to touch on images,
a quintessential part of the rendering process.
As you may know, graphics programmers use images not just for storing colors, but also
depth, normals, and more.
For this reason, images come in different sizes and formats.
Images are also created along side image views which (obviously) give the GPU a
view into an image.

Similar to vertex and index buffers, images should ideally live in GPU memory.
For this reason, images also require a staging buffer.

When creating the image, we use commands to copy the data in.
However, this time around, we need image memory barrier.
In GPU memory, images are not stored in a way that you or I expect.
Rather, they are stored in a layout designed to be optimal.
This optimal layout varies across systems, so in typical Vulkan fashion, we need
to manually change the layout to be optimal for transfer, then change it back.
This is what an image memory barrier accomplishes.
Remember them as we'll need them later on.

> I mentioned commands here, but once again, I'll talk about commands later on.

### Framebuffer and Attachment Images

An attachment image is one that we attach to the render process.
For example, if I want to render a triangle into an image, I'd need one color
attachment image.
If I also wanted depth, I'd need one more depth attachment image.
For even more advanced rendering techniques like deferred rendering, I'd attach
even more color attachment images.

We have all of these attachment images, but how do we use them?
Well, we need to create a framebuffer which we attach the image views of our
attachment images to.
A framebuffer also holds our render pass.

### Render Pass and Sub-Passes

<!--
```
Attachment Image
Framebuffer
Render Pass / Subpass

Swapchain and Surface
Double Buffering

Textures
Input Attachment
Push Constants
Command Buffers
Submission and Synchronization

Dynamic Uniforms
```
-->

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

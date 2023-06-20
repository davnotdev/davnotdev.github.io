---
layout: ../../../layouts/BlogLayout.astro
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
Currently, I would call it safe to bind up to 32 descriptors as more than 58% of platforms
support this.
This should increase going forward.

### Uniform Buffers 


<!--
```
Descriptors
Uniform Buffers
Storage Buffers
Padding

Swapchain and Surface
Double Buffering

Textures
Input Attachment
Push Constants
Command Buffers
Submission and Synchronization

Attachment Image
Framebuffer
Render Pass / Subpass

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

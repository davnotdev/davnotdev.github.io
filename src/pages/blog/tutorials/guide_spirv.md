---
layout: ../../../layouts/BlogLayout.astro
---

# A Masochist's Guide to SPIR-V

> An honest disclaimer!
> You will probably never need this every in your life.
> I still encourage you to read on anyway!

## Introduction: Welcome The World of Shaders

GPUs are designed very differently compared to CPUs.
The programming languages we use today are very intimately tied to the
architecture of modern CPUs.
[(Very interesting read about this here.)](https://queue.acm.org/detail.cfm?id=3212479)
For this reason, we are dependent on shader programming languages to write code
on the GPU, but historically, these languages have always been tied to specific
platforms or vendors.

- [ARB Assembly](https://en.wikipedia.org/wiki/ARB_assembly_language): Tied to nVidia.
- [GLSL](https://en.wikipedia.org/wiki/OpenGL_Shading_Language): Tied to OpenGL.
- [HLSL](https://en.wikipedia.org/wiki/High-Level_Shader_Language): Tied to Windows and DirectX.
- [MSL](https://medium.com/@shoheiyokoyama/whats-metal-shading-language-msl-96fe63257994): Tied to MacOS and Metal.

These variations were a heavy weight for cross platform programmers.
But, the create of SPIR-V changed all of this.
Originally, this was just another language to add to the list, but the
flexibility and tooling of language made it possible to transform and
convert the language into almost any other!

![Image of SPIR-V Cross](https://www.khronos.org/assets/uploads/apis/2020-spir-landing-page-01_2.jpg)

Alright, great!
We should all learn SPIR-V.
Well, not quite, SPIR-V is an intermediate representation, similar to x86\_64
binary (not really) or (more like) LLVM IR.
You aren't meant to use it directly.
Rather, you use a higher level language like GLSL or WGLSL (one day perhaps) to
compile with SPIR-V as the target.
Well, that's how you're *supposed* to use it.

`https://github.com/executablebooks/mdformat/issues?page=1&q=is%3Aissue+is%3Aopen < issue here, investigate tommorow`

Welcome to the **Masochist's Guide to SPIR-V**.

This is not a gentle guide.
Rather, I will throw you straight in with examples.
Good luck.

## The Setup

First, you need `spirv-as`, the assembler which you can find [here](https://github.com/KhronosGroup/SPIRV-Tools).

Now, create a file called `hello.spas` which you can assemble with
`spirv-as hello.spas -o hello.spv`.

> What's a "dot spas"?
> I have no clue, I made that one up.
> In my defense, it's fun to say.

Now, start with the boilerplate:

```spirv
            ; What type of shader is this?
                OpCapability Shader
                OpMemoryModel Logical Simple
                OpEntryPoint Vertex %main "main"

            ; Debug info
                OpName %main "main"

            ; Declare types
%void =         OpTypeVoid
%func_void =    OpTypeFunction %void

            ; Function main
%main =         OpFunction %void None %func_void
%main_label =   OpLabel
                OpReturn
                OpFunctionEnd
```

Ok, there's quite a bit of information here, but most of obvious stuff can be inferred.
The details of `OpMemoryModel` don't matter all that much, but your options are
[here](https://registry.khronos.org/SPIR-V/specs/unified1/SPIRV.html#Addressing_Model)
with the explanation
[here](https://registry.khronos.org/SPIR-V/specs/unified1/SPIRV.html#_memory_model).

`OpEntryPoint` specifies the entry point (duh), but also the
[execution model](https://registry.khronos.org/SPIR-V/specs/unified1/SPIRV.html#_execution_model)
like `Vertex`, `Fragment`, `Geometry`, etc.

One interesting bit is the need to declare types.
Since our main function takes no input and outputs nothing, we just leave it as void.

`OpFunction`'s `None` refers to
["Function Control"](https://registry.khronos.org/SPIR-V/specs/unified1/SPIRV.html#Function_Control),
optimization hints such as `Inline`, `Pure`, `DontInline`, etc.

`OpLabel` is just a label that can be jumped to later similar to other assembly languages.

## A Basic Function

```spirv
            ; What type of shader is this?
                OpCapability Shader
                OpMemoryModel Logical Simple
                OpEntryPoint Vertex %main "main"

            ; Debug info
                OpName %main "main" 

            ; Declare types
%void =         OpTypeVoid
+ %float =      OpTypeFloat 32
+ %func_void =  OpTypeFunction %void
+ %func_x2inc = OpTypeFunction %float %float %float
+ %ptr_float =  OpTypePointer Function %float

+             ; Constants
+ %float_0 =    OpConstant %float 0
+ %float_1 =    OpConstant %float 1
+ %float_2 =    OpConstant %float 2

            
            ; Function main
%main =         OpFunction %void None %func_void
%main_label =   OpLabel

+ %final_res =  OpFunctionCall %float %x2inc %float2

                OpReturn
                OpFunctionEnd

+          ; Function to double and increment a number
+ %x2inc =      OpFunction %float None %func_x2inc
+ %num =        OpFunctionParameter %ptr_float
+ %x2inc_label =OpLabel
+     
+ %res0 =       OpVariable %ptr_float Function
+               OpStore %res0 %num
+ 
+ %res1 =       OpFMul %float %res0 %float_2
+ %res2 =       OpFAdd %res1 %float %float_1
+                 
+               OpReturnValue %res2
+ 
+               OpReturn
+               OpFunctionEnd
```

> I added diff indicators so that you know what I've added.
> I despise tutorials that don't do this.

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

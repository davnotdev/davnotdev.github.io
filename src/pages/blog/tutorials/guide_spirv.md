---
layout: ../../../layouts/BlogLayout.astro
title: "A Masochist's Guide to SPIR-V"
description: "spirv / SPIR-V for masochist shader programmers."
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

Welcome to the **Masochist's Guide to SPIR-V**.

This is not a gentle guide.
Rather, I will throw you straight in with examples.
Good luck.

## The Setup

First, you need `spirv-as`, the assembler which you can find [here](https://github.com/KhronosGroup/SPIRV-Tools).
`spirv-as` itself is not enough however as it will happily pass broken code.
`spirv-val` is used to validate the generated SPIR-V.
Then, you can go a step further and use `spirv-opt` for optimizations.

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
            ; ...

            ; Declare types
%float =        OpTypeFloat 32
%func_void =    OpTypeFunction %void
%ptr_float =    OpTypePointer Function %float
%func_myfunc =  OpTypeFunction %float %ptr_float

            ; Constants
%float_1 =      OpConstant %float 1
%float_2 =      OpConstant %float 2
            
            ; Function main
%main =         OpFunction %void None %func_void
%main_label =   OpLabel

%var_float_2 =  OpVariable %ptr_float Function %float_2
            ;   OpStore %ptr_float %float_2

%final_res =    OpFunctionCall %float %my_func %var_float_2

                OpReturn
                OpFunctionEnd

            ; Function: Multiply %num by 2 and add 1
%my_func =      OpFunction %float None %func_myfunc
%num =          OpFunctionParameter %ptr_float
%my_fun_label = OpLabel

%res0 =         OpLoad %float %num

%res1 =         OpFMul %float %res0 %float_2
%res2 =         OpFAdd %float %res1 %float_1

                OpReturnValue %res2

                OpFunctionEnd

```

> I've omitted a bit of the code.

Most of this is pretty self explanatory, so I'll only explain those that are not.

`OpTypeFunction` takes the return type, then an arbitrary number of parameters types.

`OpLoad` and `OpStore` work exactly as pointers do in C.

`OpVariable`'s `%float2` initializer is optional and must be a constant.
Variables must also be a pointer type and declared at the top of the function, similar to C89.

`%ptr_float`. defines a pointer to a float.
The `Function` bit basically denotes that the value is scoped for its respective function.
The same applies with `OpVariable`.

In `OpFAdd`, `F` refers to floats.
Now, you can probably infer that `OpIAdd` would refer to integers.

## Control Flow and Loops

```spirv
		    ; Function: Add 1 to num1 four times if num2 is > 10.
%my_func =      OpFunction %float None %func_myfunc
%ptr_num1 =     OpFunctionParameter %ptr_float
%ptr_num2 =     OpFunctionParameter %ptr_float
%my_fun_label = OpLabel

            ;   int i = 0;
%i =            OpVariable %ptr_int Function %int_0
%out =          OpVariable %ptr_float Function

%num1 =         OpLoad %float %ptr_num1
%num2 =         OpLoad %float %ptr_num2

                OpStore %out %num1

            ;   if(%num2 > 10)
            ;   {
%is_gt =        OpFOrdGreaterThan %bool %num2 %float_10
                OpSelectionMerge %if_end None
                OpBranchConditional %is_gt %if_label %if_end
%if_label =     OpLabel

            ;   for(; i < 4; i++)
            ;   {

                OpBranch %loop_label
%loop_label =   OpLabel
                OpLoopMerge %loop_break %continue None
                OpBranch %merge_label
%merge_label =  OpLabel
%vali =         OpLoad %int %i
%for_lt =       OpSLessThan %bool %vali %int_4
                OpBranchConditional %for_lt %loop_if %loop_break
%loop_if =      OpLabel

%valout =       OpLoad %float %out
%out_add_res =  OpFAdd %float %valout %float_1
                OpStore %out %out_add_res

                OpBranch %continue
%continue =     OpLabel

%res_i =        OpIAdd %int %vali %int_1
                OpStore %i %res_i

                OpBranch %loop_label
            ;   }
%loop_break =   OpLabel

                OpBranch %if_end
            ;   }
%if_end =       OpLabel

%res_out =      OpLoad %float %out
                OpReturnValue %res_out

                OpFunctionEnd
```

> Once again, I've omitted more code.

Here, we check if `%num2` is greater than 10.
If so, we run a loop that adds 1 to `%num1` 10 times.

The if statement is pretty simple.

`OpFOrdGreaterThan` does exactly what you think it does.
You can find all the comparison operators [here](https://registry.khronos.org/SPIR-V/specs/unified1/SPIRV.html#_fp_fast_math_mode).
For signed integers, the prefix `S` is used rather than `F`, and `U` for unsigned integers.
Also, `Ord` is not apart of the name for integer conversions.
Anyway, the conditional test is followed by `OpSelectionMerge` which basically defined the if statement's block, and `None` has to do with more optimization stuff.
Finally `OpBranchConditional`takes the block jump label for a true condition followed by the jump label for a false condition.
`OpBranchConditional` is followed by a label itself.

The for loop portion is much more confusing.
`OpLoopMerge` first takes the end of the block, then the continue which is essentially the `i++` in `for(i = 0; i < 4; i++)`.
The conditional `i < 4` portion remains the same.

Do note that SPIR-V is pedantic when it comes to labels.
*Almost* all labels must be proceeded by an `OpBranch`.
That's why you see the `OpBranch %continue` right before the `%continue = OpLabel`.
That is required.


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

---
layout: ../../../layouts/BlogLayout.astro
---

# Dancing of the Line of Requirement with LISP

I'm currently studying AP Computer Science Principles independently, and up to
this point, I've been a serial procrastinator.
One requirement of the course is the "Performance Task": an evaluation of the
student's ability to apply computer science.
Basically, you need to submit a PDF of some basic code that fulfills a set of requirements.
Oh, and you can do it in **ANY** programming language.
Interesting indeed...

## Why LISP?

My ultimate goal was to use the most obscure language I know.
Here were the candidates I had in mind:

- 6502 Assembly
- x86_64 Assembly (Intel Syntax) (Linux 64-bit)
- Any LISP dialect

To be frank, based on the
[standards](https://apcentral.collegeboard.org/media/pdf/ap-computer-science-principles-course-and-exam-description.pdf#page=197)
and
[past requirements](https://apcentral.collegeboard.org/media/pdf/ap-computer-science-principles-2021-pilot-scoring-guidelines.pdf),
neither assemblies will work.
They are simply too low level for some of the abstractions described.
(For example, a "variable" can mean a few things in x86_64.)
I mean, you could argue that they can complete the requirements, but the College
Board people aren't here for arguments.

> What would be considered input and output on a 6502?
> Electrical signals?

## We Read the Title! Just Talk About LISP Already

Ok fine.
I ended up using [fennel](https://fennel-lang.org/) which is basically LISP and
Lua's baby.
I won't show the actual code of course, but there are so many places where LISP
dances on the boundary of the requirements which I find hilarious.
I'll show one here.

Here's the requirement:

> "identifies the name of the variable representing the
> list being used in this response."

Alright, here's some code.

```fennel
(fn abc [inputs]
    (icollect [_ input (ipair inputs)]
        (* input 2)))
```

Now, tell me.
Where's the list in this code?
Well...
Everything's a list!
That's the beauty of LISP: everything's an "S-EXP" which is just a fancy way of saying
"linked list".
Yes, you could argue that everything here is a list, but I don't think the
College Board people would be very pleased with that answer.

`icollect` creates a list, so maybe that counts?
Well, that doesn't "identify the name of the variable" for the list because
there is no variable to be seen.
Here is what I ended up doing:

```fennel
(fn abc [inputs]
    (var list [])
    (set list (icollect [_ input (ipair inputs)]
        (* input 2)))
    list)
```

*Ewww*, we just took a perfectly good S-EXP and made it much worse.

---

> Implementation of built-in or existing procedures or language structures, such
> as event handlers or main methods, are not considered student-developed.

Ok, this one isn't LISP specific, but what exactly does this mean?
I get the simple cases for example, a `sort` function would not be counted as student-developed.

```rust
[0, 1, 2, 3]
    .into_iter()
    .filter_map(|n| (n % 2 == 0).then_some(n + 1))
    .collect::<Vec<_>>();
```

But is the above code student-developed-enough?
Sure, rust is doing the heavy lifting with its built-in iterator functions, and
one can argue that closures are "event handlers" in some ways.
But this passes right?
Right?

---

From yet another [scoring sheet](https://apcentral.collegeboard.org/media/pdf/ap-csp-2020-scoring-guidelines.pdf),
"Do NOT award a point if ... the algorithm consists of a single instruction."
That's funny.
What even is "a single instruction"?

```assembly
_start:
    mov rax, 0
    ret
```

My procedure here is actual *two* instructions.
But in all seriousness, this raises an interesting question with lisp.

```fennel
(fn print-if-found [list targets]
    (each [_ list-item (ipairs list)]
        (each [_ target-item (ipairs targets)]
            (if (= list-item target-item)
                (print list-item))))
```

This code does satisfy the definition of an algorithm (since it has sequencing,
selection, and iteration).
It fits nice and snugly in one S-EXP which is arguably "a single instruction".

## Well, What's the Takeaway?

All good stories have a lesson or takeaway.
So what's the takeaway?
I haven't discussed it here, but while working on this, I was mostly thinking of
how the every big programming language is just the same now.
It's like the concept of a "programming language" has been refined and sharpened
over and over.
Don't get me wrong, that's not a bad thing.
This is just evolution killing off the bad and keeping the good.
It's just fun to look at something different and play around with it, even if you'll
never use it ever again.
I had lots of fun sucking at LISP.

> Yes, I've been very nit-picky and critical for no good reason.
> Don't get me wrong, I have nothing against AP Computer Science Principles itself.

---

Well, you've made it to the end of whatever this was.
You've wasted enough time here.
Go.
Have a nice day.

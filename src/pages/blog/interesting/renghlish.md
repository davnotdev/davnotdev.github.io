---
layout: ../../../layouts/BlogLayout.astro
title: "Renghlish"
description: "Renghlish: An alternative way to write English."
---

# Renghlish

## Huh? What are you talking about?

The Latin alphabet has evolved over thousands of years, and the 26 symbols we
use today have roots that trace back to the Phoenician alphabet and beyond.
Isn't that incredible?
Well, I have a hot take.
The way we write in English is _boring_.
Basically, we put symbols next to each other and continue left to right.
Ah wait, most languages do that but with slight variations...
Anyway, my point is that we can do better!

```plaintext
  │╭────╮  │  │ ·   │   ·     │╭──     ┌─╮·    │ · ──╮
 ─┼┼────┼──┼──┼─────┼  ───   ─┼┼──     │───────┼─────┼
  │╰──  │  │  │ ╭   │   ╭     │╰── ╭   │  ·    │     │
  │┌─┐──┤╭─╯  │─┼─╭─╯  ─┼─    │─┼──┼─  │       │┌─┐──┤
╭─╯└─┘  ││  ──╯─╯ │    ─╯   ──╯─╯ ─╯   │     ╭─╯└─┘  │
│     ──┴┴──      ┴──                  │     │     ──┴
```

> You can try this yourself [here](https://github.com/davnotdev/renghlish), but
> I recommend reading this post first.

## How does it work?

### 1. Lanes

```plaintext
─────    <= vowel lane

a b c    <= consonants

─────    <= modifiers lane
```

In languages such as Arabic, consonants are written down, then _annotated_ with vowels.
In Renghlish, these annotations are written on one of two lanes.

### 2. Modifiers?

You could argue that many sounds in English are redundant.
For example, you could say that 'k' and 'c' make a similar noise and therefore
should be interchangeable.

> [Very interesting debate about the letter 'c'](https://www.youtube.com/watch?v=chpT0TzietQ)

In Korean, it's not always possible to romanize words in one way.
For example, you probably know "김치" as
"Kimchi", but it can also technically be romanized as "Gimchi".

Renghlish uses this idea to some extent with modifiers.

```plaintext
┌─╮        ┌─╮
│          │
│          │
│   is p.  │   is a modified p aka b.
│          │
│          ┴──

But if it goes throught the line:

┌─╮        ┌─╮
│          │
│          │
│   is p.  │   is a b.
│          │
┼──        ┴──

```

### 3. Memorization Time

> Yes, sometimes, I do ignore modifier rules.

#### Consonants

![Consonant Symbol Chart image goes here.](/blog/interesting/renghlish/0.jpeg)

#### Vowels

![Vowel Symbol Chart image goes here.](/blog/interesting/renghlish/1.jpeg)

### 4. Read Order

Reading order is very simple.
You always read left to right, but the vowel lane has more priority.

```plaintext
──2─4──
1 3 5 6
```

### 5. Practice Time

```plaintext
  │·          ──╮    │╭────╮
 ─┼──────   ────┼   ─┼┼────┼
  │·  ·    ╭─╴──╯    │╰────╯
──┤        │  ┌─┐    │   ─┼─
  │        ╰──└─┘  ╭─╯    ├─
  │                │      ╰╴
```

## Your Well Deserved Prize

<img src="/blog/interesting/renghlish/2.jpeg" alt="Your Prize image goes here." id="prize"/>

> Yes, there are mistakes here, but it's still readable.

## Conclusion

Hey, thanks for reading thus far.
I hope you enjoyed and learned something from whatever nonsense this was.
Whether you took the time to actually try out the readings, I'm glad you came by.
This is my first "blog", so I hope you come back when I put more on here.
See you then!

> Wait wait!
> I may have mentioned this earlier, but you can try this yourself [here](https://github.com/davnotdev/renghlish).

<style>
img { padding: 0% 0% 2% 25%; width: 50%; }
#prize { padding: 0% 0% 2% 10%; width: 80%; }
h4 {
    text-align: center;
}
</style>

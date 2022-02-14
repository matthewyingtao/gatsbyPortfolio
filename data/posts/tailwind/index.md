---
slug: "tailwind"
title: "Initial thoughts on TailwindCSS"
date: "13/02/2022"
description: "My thoughts on TailwindCSS, it's benefits and detriments."
tags: [css, thoughts]
finished: false
---

## Introduction

The usage of TailwindCSS has been growing at an incredible rate over the last few years, but especially over the last year or so, I've heard a huge amount of discussion about whether or not Tailwind is worth using.

Much of the conversation is from people who've tried it and either really liked it or hated every second of it (though I suspect the silent majority don't have a strong opinion either way). You don't often see opinions of people who don't have a strong reaction to it, so here I am to fill that gap.

## What I like about Tailwind

### It's Fast to Write

Even though I only used it for around 4 hours, Tailwind was already faster to write than with CSS modules. CSS modules, if you haven't used them before, requires:

1. Writing the class in a CSS module file.
2. Importing the class in JavaScript.
3. Applying the class to the element.

Which means that you have to constantly switch between CSS and JS files, scroll to the top and import the class, and scroll back down to the element. Although I think the benefits of CSS modules outweighs this time sink, it's still much more cumbersome than I'd like.

With Tailwind, you can write the styles as you're writing the HTML markup, meaning, you don't have any of those previously mentioned problems, making it much faster to write after the inital learning curve.

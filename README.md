---
{
  "modules": [ "./src/asciimath-editor.ts" ]
}
---
# ➰ AsciiMath to MathML Converter

This small library converts [AsciiMath][] formulas to [MathML][]. Since all
popular browsers now support MathML, it's the lightest and easiest choice for
rendering math formulas in HTML. It doesn't require any external dependencies.

However, writing MathML by hand is very tedious as it's not meant for authoring
math equations &mdash; only rendering them. The most popular solution for
writing equations in web pages is using [LaTeX][] in conjunction with a JS 
library such as [MathJax][] or [KaTeX][]. AsciiMath is a lesser known format, 
but by far the simplest and most compact.

Refer to the [AsciiMath][] home page for the full specification. My 
implementation differs in few places as described later in this document. You 
can test equations with the editor below.

<asciimath-editor value="sum_{i=1}^n i^3=({n(n+1)}/2)^2"></asciimath-editor>

## 🍝 Motivation

I needed a simple and fast converter for my other projects. The implementation
provided in the [AsciiMath Github Page][] looked like a bowl of spaghetti to me.
So, I spent few days rewriting the parser from scratch utilizing the character 
and symbol tables in the original implementation.

Instead of editing DOM as the original version does, my version works purely 
with strings. The library exposes exactly one function which takes the AsciiMath 
equation as an argument and returns the corresponding MathML code as string.
```ts
export function asciiToMathML(text: string, inline = false): string
```
The `inline` parameter determines whether MathML is inserted inline inside a
paragraph or shown as a block.

## 🗽 Differences to Specification

I took some liberties implementing the specification to keep the syntax a bit
cleaner and the parser simpler. The differences are listed below.

### Showing Parenthesis

The spec doesn't really describe when parenthesis should be visible and when 
not. I changed the syntax so that curly braces `{` and `}` are always hidden 
and other brackets are always visible. If you want visible curly braces, use the 
symbols `{:` and `:}`.

### No TeX Alternatives

Many symbols/commands in the specification have (longer) TeX inspired 
alternative formats. To keep things simple, those alternatives are missing from
this implementation. 

### Symbol Changes

Few symbols were renamed to make them more consistent with the rest:

- Instead of `mlt` and `mgt`, use `<<` and `>>` to get the symbols 
  <math display="inline"><mo>≪</mo></math> and 
  <math display="inline"><mo>≫</mo></math>.

- Because of the previous bullet, you cannot insert angle brackets 
  <math display="inline"><mrow><mo>〈</mo><mo>...</mo><mo>〉</mo></mrow></math>
  with secodary symbols `<<` and `>>`. Use the primary symbols `(:` and `:)` 
  instead. Don't understand why angle brackets have these secondary shorthands 
  and other brackets don't.
  
### Matrix Syntax

TBD...



[AsciiMath]: https://asciimath.org/
[MathML]: https://developer.mozilla.org/en-US/docs/Web/MathML
[LaTeX]: https://en.wikibooks.org/wiki/LaTeX/Mathematics
[KaTeX]: https://katex.org/
[MathJax]: https://www.mathjax.org/
[AsciiMath Github Page]: https://github.com/asciimath/asciimathml/blob/master/ASCIIMathML.js
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

<<r:Public API>>

The `inline` parameter determines whether MathML is inserted inline inside a
paragraph or shown as a block. If `escapePunctuation` flag is set, all 
non-alphanumeric characters in text fragments are escaped with their 
corresponding character entities. This removes some issues when the resulted 
HTML is inserted to a markdown file as punctuation characters such as `_` will 
not confuse the markdown parser.

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

The syntax for matrices differs completely from the MathML specification. We
don't use double brackets to open a matrix but have separate symbols for left
and right brackets. Matrix cells are separated by semicolons instead of commas, 
and rows are separated by double semicolons instead of enclosing them in 
brackets. To demonstrate the changes, below are the same examples as presented 
in the [AsciiMath][] home page.

- `[| a; b;; c; d |]` yields to 
  <math display="inline">
    <mstyle displaystyle="true">
      <mrow>
        <mo>[</mo>
        <mtable>
          <mtr>
            <mtd>
              <mi>a</mi>
            </mtd>
            <mtd>
              <mi>b</mi>
            </mtd>
          </mtr>
          <mtr>
            <mtd>
              <mi>c</mi>
            </mtd>
            <mtd>
              <mi>d</mi>
            </mtd>
          </mtr>
        </mtable>
        <mo>]</mo>
      </mrow>
    </mstyle>
  </math>

- `(| a;; b |)` yields to
  <math display="inline">
    <mstyle displaystyle="true">
      <mrow>
        <mo>(</mo>
        <mtable>
          <mtr>
            <mtd>
              <mi>a</mi>
            </mtd>
          </mtr>
          <mtr>
            <mtd>
              <mi>b</mi>
            </mtd>
          </mtr>
        </mtable>
        <mo>)</mo>
      </mrow>
    </mstyle>
  </math>

- `{| 2x;+;17y;=;23;; x;-;y;=;5 ::|` yields to 
  <math display="inline">
    <mstyle displaystyle="true">
      <mrow>
        <mo>{</mo>
        <mtable>
          <mtr>
            <mtd>
              <mn>2</mn>
              <mi>x</mi>
            </mtd>
            <mtd>
              <mo>+</mo>
            </mtd>
            <mtd>
              <mn>17</mn>
              <mi>y</mi>
            </mtd>
            <mtd>
              <mo>=</mo>
            </mtd>
            <mtd>
              <mn>23</mn>
            </mtd>
          </mtr>
          <mtr>
            <mtd>
              <mi>x</mi>
            </mtd>
            <mtd>
              <mo>−</mo>
            </mtd>
            <mtd>
              <mi>y</mi>
            </mtd>
            <mtd>
              <mo>=</mo>
            </mtd>
            <mtd>
              <mn>5</mn>
            </mtd>
          </mtr>
        </mtable>
      </mrow>
    </mstyle>
  </math>

- Note that you can omit a matrix bracket by using `|::` as the left or `::|` as 
  the right bracket. You can also get a vertical line bracket by using `||:` 
  and `:||`.

  `||: x;; y;; z :||` renders to
  <math display="inline">
    <mstyle displaystyle="true">
      <mrow>
        <mo>|</mo>
        <mtable>
          <mtr>
            <mtd>
              <mi>x</mi>
            </mtd>
          </mtr>
          <mtr>
            <mtd>
              <mi>y</mi>
            </mtd>
          </mtr>
          <mtr>
            <mtd>
              <mi>z</mi>
            </mtd>
          </mtr>
        </mtable>
        <mo>|</mo>
      </mrow>
    </mstyle>
  </math>

Augmented matrices are not supported. Vertical separators in matrices are 
implemented with the `columnLines` attribute in the `<mtable>` element. But it's 
[deprecated][], so didn't bother implementing them. They wouldn't work in 
Chromium based browsers anyway.
 
[AsciiMath]: https://asciimath.org/
[MathML]: https://developer.mozilla.org/en-US/docs/Web/MathML
[LaTeX]: https://en.wikibooks.org/wiki/LaTeX/Mathematics
[KaTeX]: https://katex.org/
[MathJax]: https://www.mathjax.org/
[AsciiMath Github Page]: https://github.com/asciimath/asciimathml/blob/master/ASCIIMathML.js
[deprecated]: https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mtable#columnlines
/**
 * # AsciiMath to MathML Converter
 * 
 * We build a parser for [AsciiMath](https://asciimath.org/) syntax and 
 * translate it to [MathML](https://developer.mozilla.org/en-US/docs/Web/MathML)
 * string for showing equations in browser.
 * 
 * We use the `HtmlTemplate` template literal builder to construct the resulted
 * HTML. This comes from [LiTScript](https://johtela.github.io/litscript/)
 * package.
 */
import { html, HtmlTemplate } from 'litscript/src/templates/html'
/**
 * ## Parser Input
 * 
 * We encapsulate the input string into `ParserInput` class. It stores the
 * current position in the string as well as reference to the symbol table
 * defined below.
 */
class ParserInput {
    private text: string
    private pos: number
    private symbols: SymbolTable
    /**
     * Constructor initializes position to zero.
     */
    constructor(text: string, symbols: SymbolTable) {
        this.text = text
        this.symbols = symbols
        this.pos = 0        
    }
    
    eof(): boolean {
        return this.pos >= this.text.length
    }

    skipWhitespace(): number {
        while (this.pos < this.text.length && /\w/.test(this.text[this.pos]))
            ++this.pos
        return this.pos < this.text.length ? this.pos : -1
    }
    
    nextSymbol(): Symbol {
        let pos = this.skipWhitespace()
        if (pos < 0)
            return error("Input exhausted")
        let curr = this.text[pos]
        let syms = this.symbols[curr]
        let i = 0
        while (i < syms.length) {
            let sym = syms[i]
            let len = syms[i].input.length
            if (this.text.slice(pos, pos + len) == sym.input) {
                this.pos += len
                return sym
            }
        }
        return error("Invalid symbol")
    }
    
    peekChar(): string {
        return this.text[this.pos] || ""
    }

    skipChar() {
        this.pos++
    }
}

type Parser = (input: ParserInput) => HtmlTemplate

enum SymbolKind {
    Const,
    UnderOver,
    LeftBracket,
    RightBracket,
    Unary,
    Binary
}

interface Symbol {
    kind: SymbolKind
    input: string
    parser: Parser
}

type SymbolTable = { [firstLetter: string]: Symbol[] }

function error(msg: string): Symbol {
    return { 
        kind: SymbolKind.Const, 
        input: "", 
        parser: () => html`<merror><mtext>${msg}</mtext></merror>` 
    }
}

function ident(input: string, output = input): Symbol {
    return { 
        kind: SymbolKind.Const, 
        input, 
        parser: () => html`<mi>${output}</mi>` 
    }
}

function oper(input: string, output: string): Symbol {
    return { 
        kind: SymbolKind.Const, 
        input, 
        parser: () => html`<mo>${output}</mo>` 
    }
}

function textOper(input: string, output = input): Symbol {
    return { 
        kind: SymbolKind.Const, 
        input, 
        parser: () => html`<mrow><mspace width="1ex"/><mtext>${output            
            }</mtext><mspace width="1ex"/></mrow>` 
    }
}

function leftBracket(input: string, output?: string): Symbol {
    return {
        kind: SymbolKind.LeftBracket,
        input,
        parser: output ? 
            () => html`<mo>${output}</mo>` :
            () => html``
    }
}

function rightBracket(input: string, output?: string): Symbol {
    return {
        kind: SymbolKind.RightBracket,
        input,
        parser: output ? 
            () => html`<mo>${output}</mo>` :
            () => html``
    }
}

function underOverParser(base: HtmlTemplate): Parser {
    return input => {
        let under: HtmlTemplate | undefined
        let over: HtmlTemplate | undefined
        if (input.peekChar() == "_") {
            input.skipChar()
            under = sexprParser(input)
        }
        if (input.peekChar() == "^") {
            input.skipChar()
            over = sexprParser(input)
        }
        return under && over ?
                html`<munderover>${base}${under}${over}</munderover>` :
            under ? html`<munder>${base}${under}</munder>` :
            over ? html`<munder>${base}${over}</munder>` :
            base
    }
}

function unaryParser(oper: HtmlTemplate): Parser {
    return input => {
        let arg = sexprParser(input)
        return html`<mrow>${oper}${arg}</mrow>`
    }
}

function binaryParser(oper: HtmlTemplate): Parser {
    return input => {
        let arg1 = sexprParser(input)
        let arg2 = sexprParser(input)
        return html`<mrow>${arg1}${oper}${arg2}</mrow>`
    }
}

function unaryEmbedParser(oper: string): Parser {
    return input => {
        let arg = sexprParser(input)
        return html`<${oper}>${arg}</${oper}>`
    }
}

function binaryEmbedParser(oper: string, argParser: Parser): Parser {
    return input => {
        let arg1 = argParser(input)
        let arg2 = argParser(input)
        return html`<${oper}>${arg1}${arg2}</${oper}>`
    }
}

function unarySurroundParser(left: HtmlTemplate, right: HtmlTemplate): Parser {
    return input => {
        let arg = sexprParser(input)
        return html`<mrow>${left}${arg}${right}</mrow>`
    }
}

function parseSExpr(input: ParserInput): [HtmlTemplate, Symbol] {
    let sym = input.nextSymbol()
    if (sym.kind == SymbolKind.LeftBracket) {
        let lbrac = sym.parser(input)
        let exp = exprParser(input)
        let sym2 = input.nextSymbol()
        let rbrac = sym2.kind == SymbolKind.RightBracket ?
            sym2.parser(input) : error("Missing closing paren")
        return [html`${lbrac}${exp}${rbrac}`, sym]
    }
    return [sym.parser(input), sym]
}

function sexprParser(input: ParserInput): HtmlTemplate {
    return parseSExpr(input)[0]
}

function iexprParser(input: ParserInput): HtmlTemplate {
    let [res, sym] = parseSExpr(input)
    let sub: HtmlTemplate | undefined
    let sup: HtmlTemplate | undefined
    if (input.peekChar() == "_") {
        input.skipChar()
        sub = sexprParser(input)
    }
    if (input.peekChar() == "^") {
        input.skipChar()
        sup = sexprParser(input)
    }
    if (sym.kind == SymbolKind.UnderOver)
        return sub && sup ? html`<munderover>${res}${sub}${sup}</munderover>` :
            sub ? html`<munder>${res}${sub}</munder>` :
            sup ? html`<mover>${res}${sup}</mover>` :
            res
    else
        return sub && sup ? html`<msubsup>${res}${sub}${sup}</msubsup>` :
            sub ? html`<msub>${res}${sub}</msub>` :
            sup ? html`<msup>${res}${sup}</msup>` :
            res
}

function exprParser(input: ParserInput): HtmlTemplate {
    return html``
}

function underOverOper(input: string, oper = input): Symbol {
    return { 
        kind: SymbolKind.UnderOver, 
        input, 
        parser: underOverParser(html`<mo>${oper}</mo>`) 
    }
}

function unary(input: string, oper = input): Symbol {
    return { 
        kind: SymbolKind.Unary, 
        input, 
        parser: unaryParser(html`<mo>${oper}</mo>`) 
    }
}

function binary(input: string, oper = input): Symbol {
    return { 
        kind: SymbolKind.Binary, 
        input, 
        parser: binaryParser(html`<mo>${oper}</mo>`) 
    }
}

function unaryEmbed(input: string, oper: string): Symbol {
    return { 
        kind: SymbolKind.Unary, 
        input, 
        parser: unaryEmbedParser(oper) 
    }
}

function binaryEmbed(input: string, oper: string, argParser: Parser): Symbol {
    return { 
        kind: SymbolKind.Binary, 
        input, 
        parser: binaryEmbedParser(oper, argParser)
    }
}

function unarySurround(input: string, left: string, right: string): Symbol {
    return { 
        kind: SymbolKind.Unary, 
        input, 
        parser: unarySurroundParser(html`<mo>${left}</mo>`, 
            html`<mo>${right}</mo>`) 
    }
}

const symbols: SymbolTable = {
    a: [
        unary("arcsin"),
        unary("arccos"),
        unary("arctan"),
        ident("alpha", "\u03B1"),
        oper("aleph", "\u2135"),
        unarySurround("abs", "|", "|"),
        textOper("and", "and"),
        ident("a")
    ],
    A: [
        unary("Arcsin"),
        unary("Arccos"),
        unary("Arctan"),
        unarySurround("Abs", "|", "|"),
        oper("AA", "\u2200"),
        ident("A")
    ],
    b: [
        ident("beta", "\u03B2"),
        ident("b")
    ],
    B: [
        ident("B")
    ],
    c: [
        oper("cdots", "\u22EF"),
        unarySurround("ceil", "\u2308", "\u2309"),
        unary("cosh"),
        unary("csch"),
        unary("cos"),
        unary("cot"),
        unary("csc"),
        ident("chi", "\u03C7"),
        ident("c")
    ],
    C: [
        unary("Cosh"),
        unary("Cos"),
        unary("Cot"),
        unary("Csc"),
        oper("CC", "\u2102"),
        ident("C")
    ],
    d: [
        oper("diamonds", "\u22C4"),
        ident("delta", "\u03B4"),
        oper("ddots", "\u22F1"),
        oper("darr", "\u2193"),
        oper("del", "\u2202"),
        unary("det"),
        textOper("dim"),
        ident("d")
    ],
    D: [
        oper("Delta", "\u0394"),
        ident("D")
    ],
    e: [
        ident("epsi", "\u03B5"),
        ident("eta", "\u03B7"),
        unary("exp"),
        ident("e")
    ],
    E: [
        oper("EE", "\u2203"),
        ident("E")
    ],
    f: [
        unarySurround("floor", "\u230A", "\u230B"),
        oper("frown", "\u2322"),
        binaryEmbed("frac", "mfrac", sexprParser),
        ident("f")
    ],
    F: [
        ident("F")
    ],
    g: [
        ident("gamma", "\u03B3"),
        oper("grad", "\u2207"),
        unary("gcd"),
        textOper("glb"),
        ident("g")
    ],
    G: [
        oper("Gamma", "\u0393"),
        ident("G")
    ],
    h: [
        oper("harr", "\u2194"),
        oper("hArr", "\u21D4"),
        ident("h")
    ],
    H: [
        ident("H")
    ],
    i: [
        ident("iota", "\u03B9"),
        oper("int", "\u222B"),
        oper("in", "\u2208"),
        textOper("if", "if")
    ],
    I: [
        ident("I")
    ],
    j: [
        ident("j")
    ],
    J: [
        ident("J")
    ],
    k: [
        ident("kappa", "\u03BA"),
        ident("k")
    ],
    K: [
        ident("K")
    ],
    l: [
        ident("lambda", "\u03BB"),
        oper("larr", "\u2190"),
        oper("lArr", "\u21D0"),
        underOverOper("lim", "lim"),
        unary("log"),
        unary("lcm"),
        textOper("lub"),
        unary("ln"),
        ident("l")
    ],
    L: [
        oper("Lambda", "\u039B"),
        underOverOper("Lim", "Lim"),
        unary("Log"),
        unary("Ln"),
        ident("L")
    ],
    m: [
        underOverOper("min"),
        underOverOper("max"),
        textOper("mod"),
        ident("mu", "\u03BC"),
        ident("m")
    ],
    M: [
        ident("M")
    ],
    n: [
        unarySurround("norm", "\u2225", "\u2225"),
        underOverOper("nnn", "\u22C2"),
        oper("not", "\u00AC"),
        oper("nn", "\u2229"),
        ident("nu", "\u03BD"),
        ident("n")
    ],
    N: [
        oper("NN", "\u2115"),
        ident("N")
    ],
    o: [
        ident("omega", "\u03C9"),
        oper("oint", "\u222E"),
        textOper("or", "or"),
        oper("o+", "\u2295"),
        oper("ox", "\u2295"),
        oper("o.", "\u2299"),
        oper("oo", "\u221E"),
        ident("o")
    ],
    O: [
        oper("Omega", "\u03A9"),
        oper("O/", "\u2205"),
        ident("O")
    ],
    p: [
        underOverOper("prod", "\u220F"),
        ident("prop", "\u221D"),
        ident("phi", "\u03D5"),
        ident("psi", "\u03C8"),
        ident("pi", "\u03C0"),
        ident("p")
    ],
    P: [
        oper("Phi", "\u03A6"),
        ident("Psi", "\u03A8"),
        oper("Pi", "\u03A0"),
        ident("P")
    ],
    q: [
        oper("qquad", "\u00A0\u00A0\u00A0\u00A0"),
        oper("quad", "\u00A0\u00A0"),
        ident("q")
    ],
    Q: [
        oper("QQ", "\u211A"),
        ident("Q")
    ],
    r: [
        oper("rarr", "\u2192"),
        oper("rArr", "\u21D2"),
        binaryEmbed("root", "mroot", sexprParser),
        ident("rho", "\u03C1"),
        ident("r")
    ],
    R: [
        oper("RR", "\u211D"),
        ident("R")
    ],
    s: [
        oper("setminus", "\\"),
        oper("square", "\u25A1"),
        ident("sigma", "\u03C3"),
        underOverOper("sube", "\u2286"),
        underOverOper("supe", "\u2287"),
        unaryEmbed("sqrt", "msqrt"),
        unary("sinh"),
        unary("sech"),
        underOverOper("sum", "\u2211"),
        underOverOper("sub", "\u2282"),
        underOverOper("sup", "\u2283"),
        unary("sin"),
        unary("sec"),
        ident("s")
    ],
    S: [
        oper("Sigma", "\u03A3"),
        unary("Sinh"),
        unary("Sin"),
        unary("Sec"),
        ident("S")
    ],
    t: [
        ident("theta", "\u03B8"),
        unary("tanh"),
        unary("tan"),
        ident("tau", "\u03C4"),
        ident("t")
    ],
    T: [
        oper("Theta", "\u0398"),
        unary("Tanh"),
        unary("Tan"),
        oper("TT", "\u22A4"),
        ident("T")
    ],
    u: [
        ident("upsilon", "\u03C5"),
        oper("uarr", "\u2191"),
        underOverOper("uuu", "\u22C3"),
        oper("uu", "\u222A"),
        ident("u")
    ],
    U: [
        ident("U")
    ],
    v: [
        ident("varepsilon", "\u025B"),
        ident("vartheta", "\u03D1"),
        ident("varphi", "\u03C6"),
        oper("vdots", "\u22EE"),
        underOverOper("vvv", "\u22C1"),
        oper("vv", "\u2228"),
        ident("v")
    ],
    V: [
        ident("V")
    ],
    w: [
        ident("w")
    ],
    W: [
        ident("W")
    ],
    x: [
        ident("xi", "\u03BE"),
        oper("xx", "\u00D7"),
        ident("x")
    ],
    X: [
        ident("Xi", "\u039E"),
        ident("X")
    ],
    y: [
        ident("y")
    ],
    Y: [
        ident("Y")
    ],
    z: [
        ident("zeta", "\u03B6"),
        ident("z")
    ],
    Z: [
        oper("ZZ", "\u2124"),
        ident("Z")
    ],
    "-": [
        oper("__|", "\u230B"),
        oper("-<=", "\u2AAF"),
        oper("->>", "\u21A0"),
        oper("->", "\u2192"),
        oper("-<", "\u227A"),
        oper("-:", "\u00F7"),
        oper("-=", "\u2261"),
        oper("-+", "\u2213"),
        oper("-", "\u0096"),
    ],
    "*": [
        oper("***", "\u22C6"),
        oper("**", "\u2217"),
        oper("*", "\u22C5"),
    ],
    "+": [
        oper("+-", "\u00B1"),
        oper("+", "+")
    ],
    "/": [
        oper("/_\\", "\u25B3"),
        oper("/_", "\u2220"),
        oper("//", "/"),
    ],
    "\\": [
        oper("\\\\", "\\"),
        oper("\\", "\u00A0")
    ],
    "|": [
        oper("|><|", "\u22C8"),
        oper("|><", "\u22C9"),
        oper("|->", "\u21A6"),
        oper("|--", "\u22A2"),
        oper("|==", "\u22A8"),
        oper("|__", "\u230A"),
        oper("|~", "\u2308"),
        leftBracket("|:", "|")
    ],
    "<": [
        oper("<=>", "\u21D4"),
        oper("<=", "\u2264"),
        oper("<<", "\u226A"),
        oper("<", "<"),
    ],
    ">": [
        oper(">->>", "\u2916"),
        oper(">->", "\u21A3"),
        oper("><|", "\u22CA"),
        oper(">-=", "\u2AB0"),
        oper(">=", "\u2265"),
        oper(">-", "\u227B"),
        oper(">>", "\u226B"),
        oper(">", ">"),
    ],
    "=": [
        oper("=>", "\u21D2"),
        oper("=", "="),
    ],
    "@": [
        oper("@", "\u2218"),
    ],
    "^": [
        underOverOper("^^^", "\u22C0"),
        oper("^^", "\u2227"),
    ],
    "~": [
        oper("~~", "\u2248"),
        oper("~=", "\u2245"),
        oper("~|", "\u2309"),
        oper("~", "\u223C"),
    ],
    "!": [
        oper("!in", "\u2209"),
        oper("!=", "\u2260"),
        oper("!", "!")
    ],
    ":": [
        oper(":=", ":="),
        rightBracket(":)", "\u232A"),
        rightBracket(":|", "|"),
        rightBracket(":}", "}"),
        oper(":.", "\u2234"),
        oper(":'", "\u2235"),
        oper(":", ":")
    ],
    ".": [
        oper("...", "..."),
    ],
    "_": [
        oper("_|_", "\u22A5")
    ],
    "'": [
        oper("'", "\u2032")
    ],
    "(": [
        leftBracket("(:", "\u2329"),
        leftBracket("(", "(")
    ],
    ")": [
        rightBracket(")", ")")
    ],
    "[": [
        leftBracket("[", "[")
    ],
    "]": [
        rightBracket("]", "]")
    ],
    "{": [
        leftBracket("{:", "{"),
        leftBracket("{")
    ],
    "}": [
        rightBracket("}")
    ],
}
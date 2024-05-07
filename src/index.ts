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
        parser: _ => html`<merror><mtext>${msg}</mtext></merror>` 
    }
}

function constIdent(input: string, output: string): Symbol {
    return { 
        kind: SymbolKind.Const, 
        input, 
        parser: _ => html`<mi>${output}</mi>` 
    }
}

function constOper(input: string, output: string): Symbol {
    return { 
        kind: SymbolKind.Const, 
        input, 
        parser: _ => html`<mo>${output}</mo>` 
    }
}

function textOper(input: string, output: string): Symbol {
    return { 
        kind: SymbolKind.Const, 
        input, 
        parser: _ => html`<mrow><mspace width="1ex"/><mtext>${output            
            }</mtext><mspace width="1ex"/></mrow>` 
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

function sexprParser(input: ParserInput): HtmlTemplate {
    return html``
}

function underOverOper(input: string, oper: string): Symbol {
    return { kind: SymbolKind.UnderOver, input, 
        parser: underOverParser(html`<mo>${oper}</mo>`) }
}

const symbols: SymbolTable = {
    a: [
        constIdent("alpha", "\u03B1"),
        textOper("and", "and")
    ],
    A: [
        constOper("AA", "\u2200")
    ],
    b: [
        constIdent("beta", "\u03B2")
    ],
    c: [
        constIdent("chi", "\u03C7")
    ],
    d: [
        constIdent("delta", "\u03B4")
    ],
    D: [
        constOper("Delta", "\u0394")
    ],
    e: [
        constIdent("epsi", "\u03B5")
    ],
    E: [
        constOper("EE", "\u2203")
    ],
    f: [
        constIdent("eta", "\u03B7")
    ],
    g: [
        constIdent("gamma", "\u03B3")
    ],
    G: [
        constOper("Gamma", "\u0393")
    ],
    h: [
        constIdent("iota", "\u03B9")
    ],
    i: [
        constOper("in", "\u2208"),
        textOper("if", "if")
    ],
    j: [
    ],
    k: [
        constIdent("kappa", "\u03BA")
    ],
    l: [
        constIdent("lambda", "\u03BB")
    ],
    L: [
        constOper("Lambda", "\u039B")
    ],
    m: [
        constIdent("mu", "\u03BC")
    ],
    n: [
        underOverOper("nnn", "\u22C2"),
        constOper("not", "\u00AC"),
        constOper("nn", "\u2229"),
        constIdent("nu", "\u03BD")
    ],
    o: [
        constIdent("omega", "\u03C9"),
        textOper("or", "or"),
        constOper("o+", "\u2295"),
        constOper("ox", "\u2295"),
        constOper("o.", "\u2299"),
    ],
    O: [
        constOper("Omega", "\u03A9")
    ],
    p: [
        underOverOper("prod", "\u220F"),
        constIdent("prop", "\u221D"),
        constIdent("phi", "\u03D5"),
        constIdent("psi", "\u03C8"),
        constIdent("pi", "\u03C0"),
    ],
    P: [
        constOper("Phi", "\u03A6"),
        constIdent("Psi", "\u03A8"),
        constOper("Pi", "\u03A0"),
    ],
    q: [
    ],
    r: [
        constIdent("rho", "\u03C1")
    ],
    s: [
        constOper("setminus", "\\"),
        constIdent("sigma", "\u03C3"),
        underOverOper("sube", "\u2286"),
        underOverOper("supe", "\u2287"),
        underOverOper("sum", "\u2211"),
        underOverOper("sub", "\u2282"),
        underOverOper("sup", "\u2283"),
    ],
    S: [
        constOper("Sigma", "\u03A3"),
    ],
    t: [
        constIdent("theta", "\u03B8"),
        constIdent("tau", "\u03C4"),
    ],
    T: [
        constOper("Theta", "\u0398"),
        constOper("TT", "\u22A4")
    ],
    u: [
        constIdent("upsilon", "\u03C5"),
        underOverOper("uuu", "\u22C3"),
        constOper("uu", "\u222A"),
    ],
    v: [
        constIdent("varepsilon", "\u025B"),
        constIdent("vartheta", "\u03D1"),
        constIdent("varphi", "\u03C6"),
        underOverOper("vvv", "\u22C1"),
        constOper("vv", "\u2228"),
    ],
    w: [
        constIdent("", "")
    ],
    x: [
        constIdent("xi", "\u03BE"),
        constOper("xx", "\u00D7"),
    ],
    X: [
        constIdent("Xi", "\u039E")
    ],
    y: [
        constIdent("", "")
    ],
    z: [
        constIdent("zeta", "\u03B6")
    ],
    "-": [
        constOper("-<=", "\u2AAF"),
        constOper("-<", "\u227A"),
        constOper("-:", "\u00F7"),
        constOper("-=", "\u2261"),
        constOper("~=", "\u2245"),
        constOper("-", "\u0096"),
    ],
    "*": [
        constOper("***", "\u22C6"),
        constOper("**", "\u2217"),
        constOper("*", "\u22C5"),
    ],
    "/": [
        constOper("//", "/"),
    ],
    "\\": [
        constOper("\\\\", "\\"),
    ],
    "|": [
        constOper("|><|", "\u22C8"),
        constOper("|><", "\u22C9"),
        constOper("|--", "\u22A2"),
        constOper("|==", "\u22A8")
    ],
    "<": [
        constOper("<=>", "\u21D4"),
        constOper("<=", "\u2264"),
        constOper("<<", "\u226A"),
        constOper("<", "<"),
    ],
    ">": [
        constOper("><|", "\u22CA"),
        constOper(">-=", "\u2AB0"),
        constOper(">=", "\u2265"),
        constOper(">-", "\u227B"),
        constOper(">>", "\u226B"),
        constOper(">", ">"),
    ],
    "=": [
        constOper("=>", "\u21D2"),
        constOper("=", "="),
    ],
    "@": [
        constOper("@", "\u2218"),
    ],
    "^": [
        underOverOper("^^^", "\u22C0"),
        constOper("^^", "\u2227"),
    ],
    "~": [
        constOper("~~", "\u2248"),
        constOper("~", "\u223C"),
    ],
    "!": [
        constOper("!in", "\u2209"),
        constOper("!=", "\u2260"),
    ],
    ":": [
        constOper(":=", ":="),
    ],
    "_": [
        constOper("_|_", "\u22A5")
    ]
}
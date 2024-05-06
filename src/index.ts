import { html, HtmlTemplate } from 'litscript/src/templates/html'

class ParserInput {
    private text: string
    private pos: number
    private symbols: SymbolTable
    
    constructor(text: string, symbols: SymbolTable) {
        this.text = text
        this.symbols = symbols
        this.pos = 0        
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

interface Symbol {
    input: string
    parser: Parser
}

type SymbolTable = { [firstLetter: string]: Symbol[] }

function error(msg: string): Symbol {
    return { input: "", parser: _ => html`<merror><mtext>${msg
       }</mtext></merror>` }
}

function constIdent(input: string, output: string): Symbol {
    return { input, parser: _ => html`<mi>${output}</mi>` }
}

function constOper(input: string, output: string): Symbol {
    return { input, parser: _ => html`<mo>${output}</mo>` }
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
    return { input, parser: underOverParser(html`<mo>${oper}</mo>`) }
}

const symbols: SymbolTable = {
    a: [
        constIdent("alpha", "\u03B1")
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
        constIdent("", "")
    ],
    j: [
        constIdent("", "")
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
        constIdent("nu", "\u03BD")
    ],
    o: [
        constIdent("omega", "\u03C9"),
        constOper("o+", "\u2295"),
        constOper("ox", "\u2295"),
        constOper("o.", "\u2299"),
    ],
    O: [
        constOper("Omega", "\u03A9")
    ],
    p: [
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
        constIdent("", "")
    ],
    r: [
        constIdent("rho", "\u03C1")
    ],
    s: [
        constIdent("sigma", "\u03C3")
    ],
    S: [
        constOper("Sigma", "\u03A3"),
        constOper("setminus", "\\"),
        underOverOper("sum", "\u2211")
    ],
    t: [
        constIdent("tau", "\u03C4"),
        constIdent("theta", "\u03B8")
    ],
    T: [
        constOper("Theta", "\u0398")
    ],
    u: [
        constIdent("upsilon", "\u03C5")
    ],
    v: [
        constIdent("varepsilon", "\u025B"),
        constIdent("varphi", "\u03C6"),
        constIdent("vartheta", "\u03D1")
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
        constOper("-", "\u0096"),
        constOper("-:", "\u00F7")
    ],
    "*": [
        constOper("*", "\u22C5"),
        constOper("**", "\u2217"),
        constOper("***", "\u22C6")
    ],
    "/": [
        constOper("//", "/"),
    ],
    "\\": [
        constOper("\\\\", "\\"),
    ],
    "|": [
        constOper("|><", "\u22C9"),
    ],
    ">": [
        constOper("><|", "\u22CA"),
        constOper("|><|", "\u22C8"),
    ],
    "@": [
        constOper("@", "\u2218"),
    ]
}
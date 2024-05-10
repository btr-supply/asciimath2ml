/**
 * # AsciiMath to MathML Converter
 * 
 * We build a parser for [AsciiMath](https://asciimath.org/) syntax and 
 * translate it to [MathML](https://developer.mozilla.org/en-US/docs/Web/MathML)
 * string for showing equations in browser.
 * 
 * ## Parser Input
 * 
 * We encapsulate the input string into `ParserInput` class. It stores the
 * current position in the string as well as reference to the symbol table
 * defined below.
 */
class ParserInput {
    private text: string
    private symbols: SymbolTable
    private charTables: string[][] = []
    pos: number
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
        while (this.pos < this.text.length && /\s/.test(this.text[this.pos]))
            ++this.pos
        return this.pos < this.text.length ? this.pos : -1
    }
    
    peekSymbol(): [Symbol, number] {
        let pos = this.skipWhitespace()
        if (pos < 0)
            return [eof(), pos]
        let curr = this.text[pos]
        /**
         * Check if input is a text `"..."` string.
         */
        if (curr == '"') {
            while (++pos < this.text.length && this.text[pos] != '"') {}
            return [text(this.text.slice(this.pos + 1, pos)), pos + 1]
        }
        /**
         * Check if input is a number.
         */
        if (/\d/.test(curr)) {
            while (pos < this.text.length && /[\d\.]/.test(this.text[pos]))
                ++pos
            return [number(this.text.slice(this.pos, pos)), pos]
        }
        /**
         * Find the correct symbol from the table.
         */
        let syms = this.symbols[curr]
        if (syms)
            for (let i = 0; i < syms.length; ++i) {
                let sym = syms[i]
                let len = sym.input.length
                if (this.text.slice(pos, pos + len) == sym.input)
                    return [sym, pos + len]
            }
        return [error(curr), pos + 1]
    }
    
    nextSymbol(): Symbol {
        let [sym, pos] = this.peekSymbol()
        if (pos >= 0)
            this.pos = pos
        return sym
    }

    pushTable(table: string[]) {
        this.charTables.push(table)
    }

    popTable() {
        this.charTables.pop()
    }

    table(): string[] | undefined {
        return this.charTables[this.charTables.length - 1]
    }
}

let calTable = ["\uD835\uDC9C", "\u212C", "\uD835\uDC9E", "\uD835\uDC9F", "\u2130", 
    "\u2131", "\uD835\uDCA2", "\u210B", "\u2110", "\uD835\uDCA5", "\uD835\uDCA6", 
    "\u2112", "\u2133", "\uD835\uDCA9", "\uD835\uDCAA", "\uD835\uDCAB", 
    "\uD835\uDCAC", "\u211B", "\uD835\uDCAE", "\uD835\uDCAF", "\uD835\uDCB0", 
    "\uD835\uDCB1", "\uD835\uDCB2", "\uD835\uDCB3", "\uD835\uDCB4", 
    "\uD835\uDCB5", "\uD835\uDCB6", "\uD835\uDCB7", "\uD835\uDCB8", 
    "\uD835\uDCB9", "\u212F", "\uD835\uDCBB", "\u210A", "\uD835\uDCBD", 
    "\uD835\uDCBE", "\uD835\uDCBF", "\uD835\uDCC0", "\uD835\uDCC1", 
    "\uD835\uDCC2", "\uD835\uDCC3", "\u2134", "\uD835\uDCC5", "\uD835\uDCC6", 
    "\uD835\uDCC7", "\uD835\uDCC8", "\uD835\uDCC9", "\uD835\uDCCA", 
    "\uD835\uDCCB", "\uD835\uDCCC", "\uD835\uDCCD", "\uD835\uDCCE", 
    "\uD835\uDCCF"]

let frkTable = ["\uD835\uDD04", "\uD835\uDD05", "\u212D", "\uD835\uDD07", 
    "\uD835\uDD08", "\uD835\uDD09", "\uD835\uDD0A", "\u210C", "\u2111", 
    "\uD835\uDD0D", "\uD835\uDD0E", "\uD835\uDD0F", "\uD835\uDD10", 
    "\uD835\uDD11", "\uD835\uDD12", "\uD835\uDD13", "\uD835\uDD14", "\u211C", 
    "\uD835\uDD16", "\uD835\uDD17", "\uD835\uDD18", "\uD835\uDD19", 
    "\uD835\uDD1A", "\uD835\uDD1B", "\uD835\uDD1C", "\u2128", "\uD835\uDD1E", 
    "\uD835\uDD1F", "\uD835\uDD20", "\uD835\uDD21", "\uD835\uDD22", 
    "\uD835\uDD23", "\uD835\uDD24", "\uD835\uDD25", "\uD835\uDD26", 
    "\uD835\uDD27", "\uD835\uDD28", "\uD835\uDD29", "\uD835\uDD2A", 
    "\uD835\uDD2B", "\uD835\uDD2C", "\uD835\uDD2D", "\uD835\uDD2E", 
    "\uD835\uDD2F", "\uD835\uDD30", "\uD835\uDD31", "\uD835\uDD32", 
    "\uD835\uDD33", "\uD835\uDD34", "\uD835\uDD35", "\uD835\uDD36", 
    "\uD835\uDD37"];

let bbbTable = ["\uD835\uDD38", "\uD835\uDD39", "\u2102", "\uD835\uDD3B", 
    "\uD835\uDD3C", "\uD835\uDD3D", "\uD835\uDD3E", "\u210D", "\uD835\uDD40", 
    "\uD835\uDD41", "\uD835\uDD42", "\uD835\uDD43", "\uD835\uDD44", "\u2115", 
    "\uD835\uDD46", "\u2119", "\u211A", "\u211D", "\uD835\uDD4A", "\uD835\uDD4B", 
    "\uD835\uDD4C", "\uD835\uDD4D", "\uD835\uDD4E", "\uD835\uDD4F", 
    "\uD835\uDD50", "\u2124", "\uD835\uDD52", "\uD835\uDD53", "\uD835\uDD54", 
    "\uD835\uDD55", "\uD835\uDD56", "\uD835\uDD57", "\uD835\uDD58", 
    "\uD835\uDD59", "\uD835\uDD5A", "\uD835\uDD5B", "\uD835\uDD5C", 
    "\uD835\uDD5D", "\uD835\uDD5E", "\uD835\uDD5F", "\uD835\uDD60", 
    "\uD835\uDD61", "\uD835\uDD62", "\uD835\uDD63", "\uD835\uDD64", 
    "\uD835\uDD65", "\uD835\uDD66", "\uD835\uDD67", "\uD835\uDD68", 
    "\uD835\uDD69", "\uD835\uDD6A", "\uD835\uDD6B"];

type Parser = (input: ParserInput) => string

enum SymbolKind {
    Default,
    UnderOver,
    LeftBracket,
    RightBracket,
    Eof
}

interface Symbol {
    kind: SymbolKind
    input: string
    parser: Parser
}

type SymbolTable = { [firstLetter: string]: Symbol[] }

function convertText(text: string, table?: string[]): string {
    if (!table)
        return text
    let res = ""
    for (let i = 0; i < text.length; ++i) {
        let ch = text.charCodeAt(i)
        res += ch >= 65 && ch < 91 ? table[ch-65] : 
            ch >= 97 && ch < 123 ? table[ch-71] : 
            text[i]
    }
    return res
}

function text(input: string): Symbol {
    return {
        kind: SymbolKind.Default,
        input,
        parser: inp => /*html*/`<mtext>${
            convertText(input, inp.table())}</mtext>`
    }
}

function number(input: string): Symbol {
    return {
        kind: SymbolKind.Default,
        input,
        parser: () => /*html*/`<mn>${input}</mn>`
    }
}

function error(msg: string): Symbol {
    return { 
        kind: SymbolKind.Default, 
        input: "", 
        parser: () => /*html*/`<merror><mtext>${msg}</mtext></merror>` 
    }
}

function eof(): Symbol {
    return { 
        kind: SymbolKind.Eof, 
        input: "", 
        parser: () => ""
    }
}

function ident(input: string, output = input): Symbol {
    return { 
        kind: SymbolKind.Default, 
        input, 
        parser: inp => /*html*/`<mi>${convertText(output, inp.table())}</mi>` 
    }
}

function oper(input: string, output: string): Symbol {
    return { 
        kind: SymbolKind.Default, 
        input, 
        parser: () => /*html*/`<mo>${output}</mo>` 
    }
}

function textOper(input: string, output = input): Symbol {
    return { 
        kind: SymbolKind.Default, 
        input, 
        parser: () => /*html*/`<mrow><mspace width="1ex"/><mtext>${output            
            }</mtext><mspace width="1ex"/></mrow>` 
    }
}

function leftBracket(input: string, output?: string): Symbol {
    return {
        kind: SymbolKind.LeftBracket,
        input,
        parser: output ? 
            () => /*html*/`<mo>${output}</mo>` :
            () => ""
    }
}

function rightBracket(input: string, output?: string): Symbol {
    return {
        kind: SymbolKind.RightBracket,
        input,
        parser: output ? 
            () => /*html*/`<mo>${output}</mo>` :
            () => ""
    }
}

function unaryParser(oper: string): Parser {
    return input => {
        let arg = sexprParser(input)
        return /*html*/`<mrow>${oper}${arg}</mrow>`
    }
}

function unaryEmbedParser(tag: string): Parser {
    return input => {
        let arg = sexprParser(input)
        return /*html*/`<${tag}>${arg}</${tag}>`
    }
}

function unaryEmbedWithParser(tag: string, arg2: string): Parser {
    return input => {
        let arg1 = sexprParser(input)
        return /*html*/`<${tag}>${arg1}${arg2}</${tag}>`
    }
}

function unarySurroundParser(left: string, right: string): Parser {
    return input => {
        let arg = sexprParser(input)
        return /*html*/`<mrow>${left}${arg}${right}</mrow>`
    }
}

function unaryAttrParser(tag: string, attr: string): Parser {
    return input => {
        let arg = sexprParser(input)
        return /*html*/`<${tag} ${attr}">${arg}</${tag}>`
    }
}

function unaryCharTableParser(table: string[]): Parser {
    return input => {
        input.pushTable(table)
        let res = sexprParser(input)
        input.popTable()
        return res
    }
}

function binaryEmbedParser(tag: string): Parser {
    return input => {
        let arg1 = sexprParser(input)
        let arg2 = sexprParser(input)
        return /*html*/`<${tag}>${arg1}${arg2}</${tag}>`
    }
}

function binaryAttrParser(tag: string, attr: string): Parser {
    return input => {
        let arg1 = input.nextSymbol().input
        let arg2 = sexprParser(input)
        return /*html*/`<${tag} ${attr}="${arg1}">${arg2}</${tag}>`
    }
}

function parseSExpr(input: ParserInput): [string, Symbol] {
    let sym = input.nextSymbol()
    if (sym.kind == SymbolKind.LeftBracket) {
        let lbrac = sym.parser(input)
        let [sym2,] = input.peekSymbol()
        let exp = sym2.kind == SymbolKind.RightBracket ? 
            "" : exprParser(input) 
        sym2 = input.nextSymbol()
        let rbrac = (sym2.kind == SymbolKind.RightBracket ? 
            sym2 : error("Missing closing paren")).parser(input)
        return [/*html*/`<mrow>${lbrac}${exp}${rbrac}</mrow>`, sym]
    }
    return [sym.parser(input), sym]
}

function sexprParser(input: ParserInput): string {
    return parseSExpr(input)[0]
}

function iexprParser(input: ParserInput): string {
    let [res, sym] = parseSExpr(input)
    let sub: string | undefined
    let sup: string | undefined
    let [next, pos] = input.peekSymbol()
    if (next.input == "_") {
        input.pos = pos
        sub = sexprParser(input);
        [next, pos] = input.peekSymbol()
    }
    if (next.input == "^") {
        input.pos = pos
        sup = sexprParser(input)
    }
    if (sym.kind == SymbolKind.UnderOver)
        return sub && sup ? /*html*/`<munderover>${res}${sub}${sup}</munderover>` :
            sub ? /*html*/`<munder>${res}${sub}</munder>` :
            sup ? /*html*/`<mover>${res}${sup}</mover>` :
            res
    else
        return sub && sup ? /*html*/`<msubsup>${res}${sub}${sup}</msubsup>` :
            sub ? /*html*/`<msub>${res}${sub}</msub>` :
            sup ? /*html*/`<msup>${res}${sup}</msup>` :
            res
}


function exprParser(input: ParserInput): string {
    let res = ""
    while (true) {
        let exp = iexprParser(input)
        let [next, pos] = input.peekSymbol()
        if (next.kind == SymbolKind.Eof || next.kind == SymbolKind.RightBracket)
            return res + exp
        if (next.input == "/") {
            input.pos = pos
            let quot = iexprParser(input)
            exp = /*html*/`$<mfrac>${exp}${quot}</mfrac>`;
            [next, ] = input.peekSymbol()
            if (next.kind == SymbolKind.Eof || next.kind == SymbolKind.RightBracket)
                return res + exp
        }
        res += exp
    }
}

function underOverOper(input: string, oper = input): Symbol {
    return { 
        kind: SymbolKind.UnderOver, 
        input, 
        parser: () => /*html*/`<mo>${oper}</mo>`
    }
}

function unary(input: string, oper = input): Symbol {
    return { 
        kind: SymbolKind.Default, 
        input, 
        parser: unaryParser(/*html*/`<mo>${oper}</mo>`) 
    }
}

function unaryEmbed(input: string, tag: string): Symbol {
    return { 
        kind: SymbolKind.Default, 
        input, 
        parser: unaryEmbedParser(tag)
    }
}

function unaryUnderOver(input: string, tag: string, arg2: string): Symbol {
    return { 
        kind: SymbolKind.UnderOver, 
        input, 
        parser: unaryEmbedWithParser(tag, /*html*/`<mo>${arg2}</mo>`) 
    }
}

function unarySurround(input: string, left: string, right: string): Symbol {
    return { 
        kind: SymbolKind.Default, 
        input, 
        parser: unarySurroundParser(/*html*/`<mo>${left}</mo>`, 
            /*html*/`<mo>${right}</mo>`) 
    }
}

function unaryAttr(input: string, tag: string, attr: string): Symbol {
    return { 
        kind: SymbolKind.Default, 
        input, 
        parser: unaryAttrParser(tag, attr) 
    }
}

function unaryCharTable(input: string, table: string[]): Symbol {
    return { 
        kind: SymbolKind.Default, 
        input, 
        parser: unaryCharTableParser(table)
    }
}

function binaryEmbed(input: string, tag: string): Symbol {
    return { 
        kind: SymbolKind.Default,
        input, 
        parser: binaryEmbedParser(tag)
    }
}

function binaryAttr(input: string, tag: string, attr: string): Symbol {
    return { 
        kind: SymbolKind.Default, 
        input, 
        parser: binaryAttrParser(tag, attr) 
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
        unaryUnderOver("bar", "mover", "\u00AF"),
        unaryCharTable("bbb", bbbTable),
        unaryAttr("bb", "mstyle", 'style="font-weight: bold"'),
        ident("b")
    ],
    B: [
        ident("B")
    ],
    c: [
        unaryAttr("cancel", "menclose", 'notation="updiagonalstrike"'),
        binaryAttr("color", "mstyle", "mathcolor"),
        binaryAttr("class", "mrow", "class"),
        oper("cdots", "\u22EF"),
        unarySurround("ceil", "\u2308", "\u2309"),
        unary("cosh"),
        unary("csch"),
        unary("cos"),
        unary("cot"),
        unary("csc"),
        ident("chi", "\u03C7"),
        unaryCharTable("cc", calTable),
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
        unaryUnderOver("ddot", "mover", ".."),
        oper("darr", "\u2193"),
        oper("del", "\u2202"),
        unary("det"),
        unaryUnderOver("dot", "mover", "."),
        textOper("dim"),
        ident("d")
    ],
    D: [
        oper("Delta", "\u0394"),
        ident("D")
    ],
    e: [
        ident("epsilon", "\u03B5"),
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
        binaryEmbed("frac", "mfrac"),
        unaryCharTable("fr", frkTable),
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
        unaryUnderOver("hat", "mover", "\u005E"),
        ident("h")
    ],
    H: [
        ident("H")
    ],
    i: [
        ident("iota", "\u03B9"),
        oper("int", "\u222B"),
        oper("in", "\u2208"),
        textOper("if", "if"),
        binaryAttr("id", "mrow", "id"),
        ident("i")
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
        unaryUnderOver("overarc", "mover", "\u23DC"),
        binaryEmbed("overset", "mover"),
        unaryUnderOver("obrace", "mover", "\u23DE"),
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
        binaryEmbed("root", "mroot"),
        ident("rho", "\u03C1"),
        ident("r")
    ],
    R: [
        oper("RR", "\u211D"),
        ident("R")
    ],
    s: [
        binaryEmbed("stackrel", "mover"),
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
        unaryAttr("sf", "mstyle", 'style="font-family: sans-serif"'),
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
        unaryUnderOver("tilde", "mover", "~"),
        unaryEmbed("text", "mtext"),
        unary("tanh"),
        unary("tan"),
        ident("tau", "\u03C4"),
        unaryAttr("tt", "mstyle", 'style="font-family: monospace"'),
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
        binaryEmbed("underset", "munder"),
        ident("upsilon", "\u03C5"),
        unaryUnderOver("ubrace", "munder", "\u23DF"),
        oper("uarr", "\u2191"),
        underOverOper("uuu", "\u22C3"),
        oper("uu", "\u222A"),
        unaryUnderOver("ul", "munder", "\u0332"),
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
        unaryUnderOver("vec", "mover", "\u2192"),
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
        oper("-", "\u2212"),
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
        oper("/", "")
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
        oper("^", "")
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
    ",": [
        oper(",", ",")
    ],
    "_": [
        oper("_|_", "\u22A5"),
        oper("_", "")
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
    ]
}

export function asciiToMathML(text: string, inline = false): string {
    let input = new ParserInput(text, symbols)
    return /*html*/`<math display="${inline ? 'inline' : 'block'
        }"><mstyle displaystyle="true">${exprParser(input)}</mstyle></math>`
}
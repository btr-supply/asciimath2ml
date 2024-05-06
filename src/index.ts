import { html, HtmlTemplate } from 'litscript/src/templates/html'

type Parser = (symbol: Symbol) => HtmlTemplate

interface Symbol {
    input: string
    parser: Parser
}

interface ConstSymbol extends Symbol {
    type: 'const'
    output: string
}

function parseConstIdent(symbol: ConstSymbol): HtmlTemplate {
    return html`<mi>${symbol.output}</mi>`
}

function parseConstOper(symbol: ConstSymbol): HtmlTemplate {
    return html`<mo>${symbol.output}</mo>`
}

function constIdent(input: string, output: string): ConstSymbol {
    return { type: 'const', input, output, parser: parseConstIdent }
}

function constOper(input: string, output: string): ConstSymbol {
    return { type: 'const', input, output, parser: parseConstOper }
}

const symbols: { [firstLetter: string]: Symbol[] } = {
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
        constIdent("omega", "\u03C9")
    ],
    O: [
        constOper("Omega", "\u03A9")
    ],
    p: [
        constIdent("phi", "\u03D5"),
        constIdent("pi", "\u03C0"),
        constIdent("psi", "\u03C8")
    ],
    P: [
        constOper("Phi", "\u03A6"),
        constOper("Pi", "\u03A0"),
        constIdent("Psi", "\u03A8")
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
        constOper("Sigma", "\u03A3")
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
        constIdent("xi", "\u03BE")
    ],
    X: [
        constIdent("Xi", "\u039E")
    ],
    y: [
        constIdent("", "")
    ],
    z: [
        constIdent("zeta", "\u03B6")
    ]
}


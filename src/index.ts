/**
 * # Implementation
 * 
 * We craft the scanner and parser for AsciiMath by hand to make them efficient 
 * and compact. We use the "official" specification for the syntax from the
 * [AsciiMath home page](https://asciimath.org/). Parts where we diverge from it
 * are described in the [README page](../readme.html).
 * 
 * ## Scanner
 * 
 * The scanner converts the input string into a stream of symbols or tokens. The 
 * symbols are defined in a big table at the end of this file. Scanner contains 
 * the following state:
 * 
 * - the input string containing the AsciiMath equation,
 * - current position in the input,
 * - reference to the symbol (token) table, and
 * - stack of character mapping tables currently in effect.
 * 
 * The type for the character mapping table is defined below. It's content is
 * described later in this file.
 */
type CharTable = string[]

class Scanner {
    private input: string
    private symbols: SymbolTable
    private charTables: CharTable[] = []
    pos: number
    /**
     * Constructor initializes position to zero and sets the symbol table.
     */
    constructor(input: string, symbols: SymbolTable) {
        this.input = input
        this.symbols = symbols
        this.pos = 0        
    }
    /**
     * If we are at the end of input `eof` method returns true.
     */
    eof(): boolean {
        return this.pos >= this.input.length
    }
    /**
     * We skip spaces, tabs and linefeeds while scanning the input. Those
     * characters are simply ignored and do not affect the output. This method
     * returns the index where the next token starts. It returns a negative 
     * number, if we are go past the end of input string.
     */
    skipWhitespace(): number {
        while (this.pos < this.input.length && /\s/.test(this.input[this.pos]))
            ++this.pos
        return this.pos < this.input.length ? this.pos : -1
    }
    /**
     * To avoid backtracking or storing lot of context information, we 
     * sometimes need to peek what the next symbol is without consuming any 
     * input. The `peekSymbol` method returns the next symbol in the input 
     * string and the input position to we need to set to skip the symbol.
     * 
     * Scanners skips whitespace preceding a symbol. We return a negative
     * position, if we are ath the end of input, and a special eof symbol.
     */
    peekSymbol(): [Symbol, number] {
        let pos = this.skipWhitespace()
        if (pos < 0)
            return [eof(), pos]
        let curr = this.input[pos]
        /**
         * Check if input is a text `"..."` string enclosed in doublequotes.
         */
        if (curr == '"') {
            while (++pos < this.input.length && this.input[pos] != '"') {}
            return [text(this.input.slice(this.pos + 1, pos)), pos + 1]
        }
        /**
         * Check if input is a number. The only accepted decimal separator is
         * dot `.`.
         */
        if (/\d/.test(curr)) {
            while (pos < this.input.length && /[\d\.]/.test(this.input[pos]))
                ++pos
            return [number(this.input.slice(this.pos, pos)), pos]
        }
        /**
         * Find the correct symbol from the table. The symbol table is a
         * dictionary whose key is the first character of a symbol and value
         * is a list of symbols starting with that character. To find the 
         * correct symbol, we first get the list of symbols for character we 
         * read from the input. The list of symbols is sorted in descending 
         * order according to the length. So, we compare them in this order and 
         * return the first one that matches the input. That way we find the 
         * longest matching token.
         */
        let syms = this.symbols[curr]
        if (syms)
            for (let i = 0; i < syms.length; ++i) {
                let sym = syms[i]
                let len = sym.input.length
                if (this.input.slice(pos, pos + len) == sym.input)
                    return [sym, pos + len]
            }
        /**
         * If we don't find a matching symbol, we skip the current character
         * and return error.
         */
        return [error(curr), pos + 1]
    }
    /**
     * Get the next symbol from the input and advance the position.
     */    
    nextSymbol(): Symbol {
        let [sym, pos] = this.peekSymbol()
        if (pos >= 0)
            this.pos = pos
        return sym
    }
    /**
     * To output a variable in a special font, we need to map its character 
     * codes to another unicode range. This way can use blackboard (double bold), 
     * calligraphic, or fraktur fonts.
     * 
     * When a command for changing font is encountered, we push a new character
     * table to the stack.
     */
    pushCharTable(table: CharTable) {
        this.charTables.push(table)
    }
    /**
     * When the scope for the new font closes, we pop the topmost table from the
     * stack.
     */
    popCharTable() {
        this.charTables.pop()
    }
    /**
     * Return the current character table or `undefined`, if the stack is empty.
     */
    charTable(): CharTable | undefined {
        return this.charTables[this.charTables.length - 1]
    }
}
/**
 * ## Character Tables
 * 
 * The available character tables are defined next. Here are some samples of
 * what character sets are available. 
 * 
 * - Blackboard command `bbb"AaBbCc"` yields: 
 *   <math display="inline"><mstyle displaystyle="true"><mtext>𝔸𝕒𝔹𝕓ℂ𝕔</mtext></mstyle></math>
 * - Calligraphic command `cc"AaBbCc"` yields: 
 *   <math display="inline"><mstyle displaystyle="true"><mtext>𝒜𝒶ℬ𝒷𝒞𝒸</mtext></mstyle></math>
 * - Fraktur command `fr"AaBbCc"` yields: 
 *   <math display="inline"><mstyle displaystyle="true"><mtext>𝔄𝔞𝔅𝔟ℭ𝔠</mtext></mstyle></math>
 * 
 * The tables contain just upper and lower case latin alphabets. No other 
 * characters are transformed. The first one is for calligraphic characters.
 */
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
/**
 * This contains fraktur characters.
 */
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
/**
 * And finally the blackboard characters.
 */
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
/**
 * Now we can define a function that converts a string using a specified
 * character table. If none is given, we return the same text back.
 */
function convertText(text: string, table?: CharTable): string {
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
/**
 * ## Parser
 * 
 * The type for parser is simple: a function that takes a scanner and returns
 * a string. In practice, parser returns the MathML fragment corresponding to
 * the MathML expression that the scanner is pointing to.
 */
type Parser = (scanner: Scanner) => string
/**
 * ## Symbols
 * 
 * Symbols are objects returned by the scanner. Each symbol has a `kind` 
 * attribute. `Default` symbols are not affecting syntax rules, they usually
 * just transform a symbol directly to a corresponding MathML fragment. Other
 * symbol kinds are used when parser needs to do some special processing.
 */
enum SymbolKind {
    Default,
    UnderOver,
    LeftBracket,
    RightBracket,
    MatrixLeftBracket,
    MatrixRightBracket,
    MatrixCellSep,    
    MatrixRowSep,    
    Eof
}
/**
 * In addition to the kind, a symbol contains the input string corresponding to
 * the symbol, and the parser which transforms the symbol to MathML.
 */
interface Symbol {
    kind: SymbolKind
    input: string
    parser: Parser
}
/**
 * Symbol table contains all symbols. It's key is the first character of a
 * symbol and value is a list of symbols starting with that character. The list 
 * is sorted in descending order according to symbols' lengths. So, the longest 
 * symbols appear first and the shortest last. This makes finding the symbol 
 * matching the current input more efficient (see the `Scanner.peekSymbol` 
 * method above).
 */
type SymbolTable = { [firstLetter: string]: Symbol[] }
/**
 * ### Text
 * 
 * Now we can define a bunch of helper functions that create symbols of various
 * kinds. The first one is used for parsing regular text strings inside 
 * equations. These are rendered inside `<mtext>` element in normal style and 
 * not as _italics_.
 * 
 * We need to do the character translation for the text using the current table.
 */
function text(input: string): Symbol {
    return {
        kind: SymbolKind.Default,
        input,
        parser: inp => /*html*/`<mtext>${
            convertText(input, inp.charTable())}</mtext>`
    }
}
/**
 * ### Numbers
 * 
 * Numbers are recognized by the scanner and translated simply to `<mn>` 
 * elements.
 */
function number(input: string): Symbol {
    return {
        kind: SymbolKind.Default,
        input,
        parser: () => /*html*/`<mn>${input}</mn>`
    }
}
/**
 * ### Errors
 * 
 * Error symbol is returned when the input is invalid. The error or unrecognized
 * symbol is put into `<merror>` element which renders it usually in red and
 * yellow box.
 */
function error(msg: string): Symbol {
    return { 
        kind: SymbolKind.Default, 
        input: "", 
        parser: () => /*html*/`<merror><mtext>${msg}</mtext></merror>` 
    }
}
/**
 * ### End of Input
 * 
 * When input string is exhausted we return an `eof` symbol. It has a special
 * kind that terminates the expression parsing rules. The parser itself returns 
 * no output.
 */
function eof(): Symbol {
    return { 
        kind: SymbolKind.Eof, 
        input: "", 
        parser: () => ""
    }
}
/**
 * ### Identifiers
 * 
 * Variables or identifiers are embedded in `<mi>` element by the parser. Here
 * we need to also convert the characters, if a font command is in effect. The
 * function below can be used for any input and output.
 */
function ident(input: string, output = input): Symbol {
    return { 
        kind: SymbolKind.Default, 
        input, 
        parser: scanner => /*html*/`<mi>${
            convertText(output, scanner.charTable())}</mi>` 
    }
}
/**
 * ### Operators
 * 
 * Simple operators are enclosed in `<mo>` elements.
 */
function oper(input: string, output: string): Symbol {
    return { 
        kind: SymbolKind.Default, 
        input, 
        parser: () => /*html*/`<mo>${output}</mo>` 
    }
}
/**
 * Some operators such as `and`, `or`, or `mod` are rendered as "normal" text.
 * These we put into `<mtext>` element  inside a `<mrow>` element, and insert 
 * leading and trailing spaces.
 */
function textOper(input: string, output = input): Symbol {
    return { 
        kind: SymbolKind.Default, 
        input, 
        parser: () => /*html*/`<mrow><mspace width="1ex"/><mtext>${output            
            }</mtext><mspace width="1ex"/></mrow>` 
    }
}
/**
 * A special kind of operator is needed for symbols that can have stuff under
 * and over them.
 */
function underOverOper(input: string, oper = input): Symbol {
    return { 
        kind: SymbolKind.UnderOver, 
        input, 
        parser: () => /*html*/`<mo>${oper}</mo>`
    }
}
/**
 * ### Brackets
 * 
 * Left bracket symbols such as `(`, `[`, `{` are returned by this function.
 * Since left brackets also trigger expression parsing rules, we give them a 
 * special kind. Note that a bracket can be also invisible. In that case, the
 * `output` argument is undefined.
 */
function leftBracket(input: string, output?: string): Symbol {
    return {
        kind: SymbolKind.LeftBracket,
        input,
        parser: output ? 
            () => /*html*/`<mo>${output}</mo>` :
            () => ""
    }
}
/**
 * Right brackets have their own kind as they terminate expression parsing. 
 * Also right brackets can be invisible.
 */
function rightBracket(input: string, output?: string): Symbol {
    return {
        kind: SymbolKind.RightBracket,
        input,
        parser: output ? 
            () => /*html*/`<mo>${output}</mo>` :
            () => ""
    }
}
/**
 * ### Symbols with One Argument
 * 
 * There are a lot of AsciiMath commands that take one argument. We call them
 * _unary_ symbols. The output generated for these commands might vary quite a 
 * lot. Thus we need many parser variants for unary symbols.
 * 
 * The simplest variant first parses the argument by invoking the `sexpr` rule, 
 * and then returns the operator and argument sequentally inside `<mrow>` 
 * element. This parser can be used for symbols like `sin` and `log`.
 */
function unaryParser(oper: string): Parser {
    return scanner => {
        let arg = sexprParser(scanner)
        return /*html*/`<mrow>${oper}${arg}</mrow>`
    }
}
/**
 * The corresponding helper function for creating the symbol.
 */
function unary(input: string, oper = input): Symbol {
    return { 
        kind: SymbolKind.Default, 
        input, 
        parser: unaryParser(/*html*/`<mo>${oper}</mo>`) 
    }
}
/**
 * The second variant embeds the argument inside a specidied MathML tag. This
 * is used for parsing square roots or text strings.
 */
function unaryEmbedParser(tag: string): Parser {
    return scanner => {
        let arg = sexprParser(scanner)
        return /*html*/`<${tag}>${arg}</${tag}>`
    }
}

function unaryEmbed(input: string, tag: string): Symbol {
    return { 
        kind: SymbolKind.Default, 
        input, 
        parser: unaryEmbedParser(tag)
    }
}
/**
 * The third variant embeds the argument into a speciefied tag with another
 * hard-coded argument that is given as a parameter to the function. This is
 * used with commands that put accents under or over a symbol. 
 */
function unaryEmbedWithParser(tag: string, arg2: string): Parser {
    return scanner => {
        let arg1 = sexprParser(scanner)
        return /*html*/`<${tag}>${arg1}${arg2}</${tag}>`
    }
}

function unaryUnderOver(input: string, tag: string, arg2: string): Symbol {
    return { 
        kind: SymbolKind.UnderOver, 
        input, 
        parser: unaryEmbedWithParser(tag, /*html*/`<mo>${arg2}</mo>`) 
    }
}
/**
 * The fourth variant surrounds the argument with specified left and right
 * bracket symbols. It's used with commands such as `abs` or `floor`.
 */
function unarySurroundParser(left: string, right: string): Parser {
    return scanner => {
        let arg = sexprParser(scanner)
        return /*html*/`<mrow>${left}${arg}${right}</mrow>`
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
/**
 * The fifth version embeds the argument inside a specified tag, and also adds
 * a specified attribute to the tag.
 */
function unaryAttrParser(tag: string, attr: string): Parser {
    return scanner => {
        let arg = sexprParser(scanner)
        return /*html*/`<${tag} ${attr}">${arg}</${tag}>`
    }
}

function unaryAttr(input: string, tag: string, attr: string): Symbol {
    return { 
        kind: SymbolKind.Default, 
        input, 
        parser: unaryAttrParser(tag, attr) 
    }
}
/**
 * The sixth and last variant is used with math font commands. We will need to
 * specify the character table which we switch on while parsing the argument.
 */
function unaryCharTableParser(table: string[]): Parser {
    return scanner => {
        scanner.pushCharTable(table)
        let res = sexprParser(scanner)
        scanner.popCharTable()
        return res
    }
}

function unaryCharTable(input: string, table: string[]): Symbol {
    return { 
        kind: SymbolKind.Default, 
        input, 
        parser: unaryCharTableParser(table)
    }
}
/**
 * ### Symbols with Two Arguments
 * 
 * Some AsciiMath commands take two arguments. We call them _binary_ symbols,
 * and parse the additional argument before returning the result. Luckily, there
 * are only two variants for binary symbols. The first one is analogous to 
 * `unaryEmbedParser`.
 */
function binaryEmbedParser(tag: string): Parser {
    return scanner => {
        let arg1 = sexprParser(scanner)
        let arg2 = sexprParser(scanner)
        return /*html*/`<${tag}>${arg1}${arg2}</${tag}>`
    }
}

function binaryEmbed(input: string, tag: string): Symbol {
    return { 
        kind: SymbolKind.Default,
        input, 
        parser: binaryEmbedParser(tag)
    }
}
/**
 * The second variant is analogous to `unaryAttrParser` but instead of getting
 * the attribute as hard-coded argument, we read it's value from the input 
 * string. The value of the argument can theoretically be any recognized symbol,
 * but in practice it almost always is a text symbol.
 */
function binaryAttrParser(tag: string, attr: string): Parser {
    return scanner => {
        let arg1 = scanner.nextSymbol().input
        let arg2 = sexprParser(scanner)
        return /*html*/`<${tag} ${attr}="${arg1}">${arg2}</${tag}>`
    }
}

function binaryAttr(input: string, tag: string, attr: string): Symbol {
    return { 
        kind: SymbolKind.Default, 
        input, 
        parser: binaryAttrParser(tag, attr) 
    }
}
/**
 * ## Grammar
 * 
 * Now that we have tools to parse the terminals of the AsciiMath syntax, we can
 * define the more complicated syntax rules for nonterminals. The whole grammar
 * is shown in an abbrevieated format below.
 * ```
 * v ::= [A-Za-z] | greek letters | numbers | other constant symbols
 * u ::= sqrt | text | bb | other unary symbols for font commands
 * b ::= frac | root | stackrel | other binary symbols
 * l ::= ( | [ | { | (: | {: | other left brackets
 * r ::= ) | ] | } | :) | :} | other right brackets
 * S ::= v | lEr | uS | bSS             Simple expression
 * I ::= S_S | S^S | S_S^S | S          Intermediate expression
 * E ::= IE | I/I                       Expression
 * ```
 * 
 * ### Simple Expressions
 * 
 * We already defined parsers for rules `v`, `u`, `b`, `l`, and `r`. So, now we
 * need a parser for the nonterminal `S` which stands for "simple expression".
 * The parser for it is shown below. It returns the MathML for S-expression and 
 * the topmost (root) symbol of the parse tree. This is needed by the `I` rule 
 * for determining whether subscripts and superscripts are shown normally, or 
 * under and over the expression.
 * 
 * We don't have to check whether a symbol is unary or binary in the `S` rule. 
 * Unary and binary symbols read their arguments inside their parsers. We only 
 * need to check whether the current symbol is a left bracket. If so, we invoke 
 * the `E` rule by calling the `exprParser`.
 * 
 * The special case is when there are no symbols between brackets. Technically,
 * that case is not supported by the grammar presented above, but in practice
 * it's an easy thing to handle; just peek if the next symbol is right bracket
 * and omit the call to `exprParser` in that case.
 * 
 * However, we need to check whether the right bracket is missing and report an
 * error then.
 */
function parseSExpr(scanner: Scanner): [string, Symbol] {
    let sym = scanner.nextSymbol()
    if (sym.kind == SymbolKind.LeftBracket) {
        let lbrac = sym.parser(scanner)
        let [sym2,] = scanner.peekSymbol()
        let exp = sym2.kind == SymbolKind.RightBracket ? 
            "" : exprParser(scanner) 
        sym2 = scanner.nextSymbol()
        let rbrac = (sym2.kind == SymbolKind.RightBracket ? 
            sym2 : error("Missing closing paren")).parser(scanner)
        return [/*html*/`<mrow>${lbrac}${exp}${rbrac}</mrow>`, sym]
    }
    return [sym.parser(scanner), sym]
}
/**
 * The function below conforms to the Parser type signature and is used when the 
 * symbol is not needed.
 */
function sexprParser(scanner: Scanner): string {
    return parseSExpr(scanner)[0]
}
/**
 * ### Intermediate Expressions
 * 
 * The `I` rule handles subscripts and superscripts. Once we've parsed a simple
 * expression, we check whether the next symbol is `_` or `^`. If either is 
 * true, we parse the subscript and/or superscript and return correct MathML
 * element based on kind of the base symbol. If the kind is `UnderOver` we use
 * `<munderover>` element (or its variant); otherwise we enclose the 
 * expressions in `<msubsup>` element.
 */
function iexprParser(scanner: Scanner): string {
    let [res, sym] = parseSExpr(scanner)
    let sub: string | undefined
    let sup: string | undefined
    let [next, pos] = scanner.peekSymbol()
    if (next.input == "_") {
        scanner.pos = pos
        sub = sexprParser(scanner);
        [next, pos] = scanner.peekSymbol()
    }
    if (next.input == "^") {
        scanner.pos = pos
        sup = sexprParser(scanner)
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
/**
 * ### Expressions
 * 
 * The `E` rule is the main parsing rule for AsciiMath expressions. It parses
 * intermediate expressions in a sequence and also handles the division 
 * operator. The parser continues as long as none of the symbols in the
 * `terminators` list is encountered. When that happens, we return to the caller
 * the expression constructed so far.
 */
const terminators = [ SymbolKind.Eof, SymbolKind.RightBracket, 
    SymbolKind.MatrixCellSep, SymbolKind.MatrixRowSep, 
    SymbolKind.MatrixRightBracket ]
/**
 * We need to check after each time `iexprParser` is called whether the next
 * symbol is a terminator. This is why it's done in two places inside the loop.
 */
function exprParser(scanner: Scanner): string {
    let res = ""
    while (true) {
        let exp = iexprParser(scanner)
        let [next, pos] = scanner.peekSymbol()
        if (terminators.includes(next.kind))
            return res + exp
        if (next.input == "/") {
            scanner.pos = pos
            let quot = iexprParser(scanner)
            exp = /*html*/`$<mfrac>${exp}${quot}</mfrac>`;
            [next, ] = scanner.peekSymbol()
            if (terminators.includes(next.kind))
                return res + exp
        }
        res += exp
    }
}
/**
 * ## Matrices
 * 
 * Our syntax for matrices differs completely from the offical specification.
 * We use separate symbols for opening and closing a matrix intead of recycling
 * standard brackets. Matrix cells are separated by semicolons instead of 
 * commas, and rows are separated by double semicolons instead of enclosing 
 * them in brackets. The reason for deviating from the original syntax is
 * purely convenience. We can make the parsing simpler and faster by not
 * reusing symbols. Hopefully our syntax is also easier to remember and use as 
 * there are no overloaded symbols.
 * 
 * The parser for matrices takes the opening left bracket as an argument. It 
 * first checks if the next symbol is a closing right bracket or if we are at 
 * the end of input. If so, we return the matrix constructed so far. If not, 
 * we parse the next matrix row by calling `matrixRowParser`.
 */
function matrixParser(leftBracket: string): Parser {
    return scanner => {
        let res = ""
        while (true) {
            let [sym, pos] = scanner.peekSymbol()
            if (sym.kind == SymbolKind.Eof ||
                sym.kind == SymbolKind.MatrixRightBracket) {
                scanner.pos = pos
                let rightBracket = sym.parser(scanner)
                return leftBracket || rightBracket ?
                    /*html*/`<mrow>${leftBracket}<mtable>${res
                        }</mtable>${rightBracket}</mrow>` :
                    /*html*/`<mtable>${res}</mtable>`
            }
            let row = matrixRowParser(scanner)
            res = /*html*/`${res}<mtr>${row}</mtr>`
        }
    }
}
/**
 * Parser for matrix rows calls `exprParser` repeatedly until either matrix row
 * separator `;;`, closing bracket, or end of input is encountered. Note that
 * `exprParser` also terminates when it sees the cell or row separator symbol 
 * or end of input.
 */
function matrixRowParser(scanner: Scanner): string {
    let res = ""
    while (true) {
        let [sym, pos] = scanner.peekSymbol()
        if (sym.kind == SymbolKind.Eof || sym.kind == SymbolKind.MatrixRowSep) {
            scanner.pos = pos
            return res
        }
        if (sym.kind == SymbolKind.MatrixRightBracket)
            return res
        let cell = exprParser(scanner)
        res = /*html*/`${res}<mtd>${cell}</mtd>`
    }
}
/**
 * Symbol for a left bracket opening a matrix is created with this function. 
 * When the `output` is undefined the bracket is not rendered.
 */
function leftMatrix(input: string, output?: string): Symbol {
    return {
        kind: SymbolKind.MatrixLeftBracket,
        input,
        parser: matrixParser(output ? /*html*/`<mo>${output}</mo>` : ""),
    }
}
/**
 * Symbol for right bracket of a matrix is created similarly.
 */
function rightMatrix(input: string, output?: string): Symbol {
    return {
        kind: SymbolKind.MatrixRightBracket,
        input,
        parser: () => output ? /*html*/`<mo>${output}</mo>` : ""
    }
}
/**
 * The cell and row separators are always invisible.
 */
function matrixCellSep(input: string): Symbol {
    return {
        kind: SymbolKind.MatrixCellSep,
        input,
        parser: () => ""
    }
}

function matrixRowSep(input: string): Symbol {
    return {
        kind: SymbolKind.MatrixRowSep,
        input,
        parser: () => ""
    }
}
/**
 * ## Symbol Table
 * 
 * Now we have all the tools needed to define the full symbol table. The table
 * covers all the possible inputs excepts for literal strings and numbers.
 */
const symbols: SymbolTable = {
    a: [
        unary("arcsin"),
        unary("arccos"),
        unary("arctan"),
        ident("alpha", "\u03B1"),
        oper("aleph", "\u2135"),
        unarySurround("abs", "|", "|"),
        textOper("and"),
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
        textOper("if"),
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
        textOper("or"),
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
        leftMatrix("||:", "|"),
        leftMatrix("|::"),
        oper("|~", "\u2308"),
        leftBracket("|:", "|"),
        rightMatrix("|)", ")"),
        rightMatrix("|]", "]"),
        rightMatrix("|}", "}"),
        oper("|", "|")
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
        rightMatrix(":||", "|"),
        rightMatrix("::|"),
        oper(":=", ":="),
        rightBracket(":)", "\u232A"),
        rightBracket(":|", "|"),
        rightBracket(":}", "}"),
        oper(":.", "\u2234"),
        oper(":'", "\u2235"),
        oper(":", ":")
    ],
    ";": [
        matrixRowSep(";;"),
        matrixCellSep(";")
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
        leftMatrix("(|", "("),
        leftBracket("(:", "\u2329"),
        leftBracket("(", "(")
    ],
    ")": [
        rightBracket(")", ")")
    ],
    "[": [
        leftMatrix("[|", "["),
        leftBracket("[", "[")
    ],
    "]": [
        rightBracket("]", "]")
    ],
    "{": [
        leftMatrix("{|", "{"),
        leftBracket("{:", "{"),
        leftBracket("{")
    ],
    "}": [
        rightBracket("}")
    ]
}
/**
 * ## External API
 * 
 * None of the types and functions defined above are exported outside this 
 * module. The only function we expose is below. It takes an AsciiMath equation
 * as the input string and returns the corresponding MathML as string. The other
 * parameter controls whether we set the display style of the equation to 
 * `block` or `inline`.
 */
export function asciiToMathML(input: string, inline = false): string {
    let scanner = new Scanner(input, symbols)
    return /*html*/`<math display="${inline ? 'inline' : 'block'
        }"><mstyle displaystyle="true">${exprParser(scanner)}</mstyle></math>`
}
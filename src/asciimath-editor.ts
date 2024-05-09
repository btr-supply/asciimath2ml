import * as ce from 'litscript/src/custom-elem'
import { asciiToMathML } from '.'

import "./asciimath-editor.css"

export class AsciiMathEditor extends ce.StyledElement {
    constructor() {
        super("asciimath-editor")
    }

    protected connect() {
        let tarea = document.createElement('textarea')
        tarea.rows = 5
        tarea.cols = 40
        tarea.spellcheck = false
        let result = document.createElement('div')
        result.className = "result"
        tarea.onchange = () => {
            result.innerHTML = asciiToMathML(tarea.value)
        }
        this.body.className = "body"
        this.body.append(tarea, result)
    }
}

customElements.define('asciimath-editor', AsciiMathEditor)
//this is only used to translate key events etc. into a human readable string
//for the actual commands we only need to have the key that's pressed and the target
class KeyCodeDictionary {

    //pass in an options object which can take new languages
    constructor(options) {
        
        // set default values for the keycodes class 
        const defaults = {

            8: {value: null, descriptor: "Backspace"},
            9: {value: null, descriptor: "Tab"},

            13: {value: null, descriptor: "Enter"},

            16: {value: null, descriptor: "Shift"},
            17: {value: null, descriptor: "Ctrl"},
            18: {value: null, descriptor: "Alt"},
            19: {value: null, descriptor: "Pause"},
            20: {value: null, descriptor: "CapsLock"},

            27: {value: null, descriptor: "Esc"},

            32: {value: " ", descriptor: "Spacebar"},
            33: {value: null, descriptor: "PageUp"},
            34: {value: null, descriptor: "PageDown"},
            35: {value: null, descriptor: "End"},
            36: {value: null, descriptor: "Home"},
            37: {value: null, descriptor: "ArrowLeft"},
            38: {value: null, descriptor: "ArrowUp"},
            39: {value: null, descriptor: "ArrowRight"},
            40: {value: null, descriptor: "ArrowDown"},
            
            44: {value: null, descriptor: "PrintScrn"},
            45: {value: null, descriptor: "Insert"},
            46: {value: null, descriptor: "Delete"},

            48: {value: "0", shiftValue: ")", descriptor: "Zero", shiftDescriptor: "CloseParens"},
            49: {value: "1", shiftValue: "!", descriptor: "One", shiftDescriptor: "ExclamationMark"},
            50: {value: "2", shiftValue: "@", descriptor: "2", shiftDescriptor: "AtSymbol"},
            51: {value: "3", shiftValue: "#", descriptor: "3", shiftDescriptor: "HashSymbol"},
            52: {value: "4", shiftValue: "$", descriptor: "4", shiftDescriptor: "DollarSymbol"},
            53: {value: "5", shiftValue: "%", descriptor: "5", shiftDescriptor: "PercentSymbol"},
            54: {value: "6", shiftValue: "^", descriptor: "6", shiftDescriptor: "PowerOfSymbol"},
            55: {value: "7", shiftValue: "&", descriptor: "7", shiftDescriptor: "Ampersand"},
            56: {value: "8", shiftValue: "*", descriptor: "8", shiftDescriptor: "Ampersand"},
            57: {value: "9", shiftValue: "(", descriptor: "9", shiftDescriptor: "OpenParens"},

            65: {value: "a", shiftValue: "A", descriptor: "Letter(a)", shiftDescriptor: "Letter(A)"},
            66: {value: "b", shiftValue: "B", descriptor: "Letter(b)", shiftDescriptor: "Letter(B)"},
            67: {value: "c", shiftValue: "C", descriptor: "Letter(c)", shiftDescriptor: "Letter(C)"},
            68: {value: "d", shiftValue: "D", descriptor: "Letter(d)", shiftDescriptor: "Letter(D)"},
            69: {value: "e", shiftValue: "E", descriptor: "Letter(e)", shiftDescriptor: "Letter(E)"},
            70: {value: "f", shiftValue: "F", descriptor: "Letter(f)", shiftDescriptor: "Letter(F)"},
            71: {value: "g", shiftValue: "G", descriptor: "Letter(g)", shiftDescriptor: "Letter(G)"},
            72: {value: "h", shiftValue: "H", descriptor: "Letter(h)", shiftDescriptor: "Letter(H)"},
            73: {value: "i", shiftValue: "I", descriptor: "Letter(i)", shiftDescriptor: "Letter(I)"},
            74: {value: "j", shiftValue: "J", descriptor: "Letter(j)", shiftDescriptor: "Letter(J)"},
            75: {value: "k", shiftValue: "K", descriptor: "Letter(k)", shiftDescriptor: "Letter(K)"},
            76: {value: "l", shiftValue: "L", descriptor: "Letter(l)", shiftDescriptor: "Letter(L)"},
            77: {value: "m", shiftValue: "M", descriptor: "Letter(m)", shiftDescriptor: "Letter(M)"},
            78: {value: "n", shiftValue: "N", descriptor: "Letter(n)", shiftDescriptor: "Letter(N)"},
            79: {value: "o", shiftValue: "O", descriptor: "Letter(o)", shiftDescriptor: "Letter(O)"},
            80: {value: "p", shiftValue: "P", descriptor: "Letter(p)", shiftDescriptor: "Letter(P)"},
            81: {value: "q", shiftValue: "Q", descriptor: "Letter(q)", shiftDescriptor: "Letter(Q)"},
            82: {value: "r", shiftValue: "R", descriptor: "Letter(r)", shiftDescriptor: "Letter(R)"},
            83: {value: "s", shiftValue: "S", descriptor: "Letter(s)", shiftDescriptor: "Letter(S)"},
            84: {value: "t", shiftValue: "T", descriptor: "Letter(t)", shiftDescriptor: "Letter(T)"},
            85: {value: "u", shiftValue: "U", descriptor: "Letter(u)", shiftDescriptor: "Letter(U)"},
            86: {value: "v", shiftValue: "V", descriptor: "Letter(v)", shiftDescriptor: "Letter(V)"},
            87: {value: "w", shiftValue: "W", descriptor: "Letter(w)", shiftDescriptor: "Letter(W)"},
            88: {value: "x", shiftValue: "X", descriptor: "Letter(x)", shiftDescriptor: "Letter(X)"},
            89: {value: "y", shiftValue: "Y", descriptor: "Letter(y)", shiftDescriptor: "Letter(Y)"},
            90: {value: "z", shiftValue: "Z", descriptor: "Letter(z)", shiftDescriptor: "Letter(Z)"},

            96: {value: "0", descriptor: "(NumPad)0"},
            97: {value: "1", descriptor: "(NumPad)1"},
            98: {value: "2", descriptor: "(NumPad)2"},
            99: {value: "3", descriptor: "(NumPad)3"},
            100: {value: "4", descriptor: "(NumPad)4"},
            101: {value: "5", descriptor: "(NumPad)5"},
            102: {value: "6", descriptor: "(NumPad)6"},
            103: {value: "7", descriptor: "(NumPad)7"},
            104: {value: "8", descriptor: "(NumPad)8"},
            105: {value: "9", descriptor: "(NumPad)9"},
            106: {value: "*", descriptor: "(NumPad)multiply"},
            107: {value: "+", descriptor: "(NumPad)add"},
            109: {value: "-", descriptor: "(NumPad)minus"},
            110: {value: ".", descriptor: "(NumPad)decimalPoint"},
            111: {value: "/", descriptor: "(NumPad)divide"},

            112: {value: null, descriptor: "F1"},
            113: {value: null, descriptor: "F2"},
            114: {value: null, descriptor: "F3"},
            115: {value: null, descriptor: "F4"},
            116: {value: null, descriptor: "F5"},
            117: {value: null, descriptor: "F6"},
            118: {value: null, descriptor: "F7"},
            119: {value: null, descriptor: "F8"},
            120: {value: null, descriptor: "F9"},
            121: {value: null, descriptor: "F10"},
            122: {value: null, descriptor: "F11"},
            123: {value: null, descriptor: "F12"},
            
            144: {value: null, descriptor: "NumLock"},
            145: {value: null, descriptor: "ScrollLock"},

            186: {value: ";", shiftValue: ":", descriptor: "SemiColon", shiftDescriptor: "Colon"},
            187: {value: ",", shiftValue: "+", descriptor: "Equals", shiftDescriptor: "Plus"},
            188: {value: ",", shiftValue: "<", descriptor: "Comma", shiftDescriptor: "LessThan"},
            189: {value: "-", shiftValue: "_", descriptor: "Dash", shiftDescriptor: "UnderScore"},
            190: {value: ".", shiftValue: ">", descriptor: "Period", shiftDescriptor: "GreaterThan"},
            191: {value: "/", shiftValue: "?", descriptor: "ForwardSlash", shiftDescriptor: "QuestionMark"},
            192: {value: "`", shiftValue: "~", descriptor: "BackTick", shiftDescriptor: "ApproxSign"},
                      
            219: {value: "[", shiftValue: "{", descriptor: "OpenBracket", shiftDescriptor: "OpenBrace"},
            220: {value: "\\", shiftValue: "|", descriptor: "BackSlash", shiftDescriptor: "Divider"},
            221: {value: "]", shiftValue: "}", descriptor: "CloseBracket", shiftDescriptor: "CloseBrace"},
            222: {value: "\'", shiftValue: "\"", descriptor: "SingleQuote", shiftDescriptor: "DoubleQuote"},

        };      
        
        // create a new object with the defaults over-ridden by the options passed in
        let opts = Object.assign({}, defaults, options);
  
        // assign options to instance data (using only property names contained in defaults object to avoid copying properties we don't want)
        Object.keys(defaults).forEach(prop => { this[prop] = opts[prop]; });
    }
  
}



    

    

    
    
    
    
   

   
//this is only used to translate key events etc. into a human readable string
//for the actual commands we only need to have the key that's pressed and the target
class KeyCodeDictionary {

    //pass in an options object which can take new languages
    constructor(options) {
        
        // set default values for the keycodes class
        // WE LISTEN TO KEYBOARD EVENTS AND SAVE NUMBER OF KEY
        // PUPPETEER REQUIRES DESCRIPTOR 
        const defaults = {

            8: {value: null, descriptor: "Backspace"},
            9: {value: null, descriptor: "Tab"},

            13: {value: null, descriptor: "Enter"},

            16: {value: null, descriptor: "Shift"},
            17: {value: null, descriptor: "Control"},
            18: {value: null, descriptor: "Alt"},
            19: {value: null, descriptor: "Pause"},
            20: {value: null, descriptor: "CapsLock"},

            27: {value: null, descriptor: "Escape"},

            32: {value: " ", descriptor: "Space"},
            33: {value: null, descriptor: "PageUp"},
            34: {value: null, descriptor: "PageDown"},
            35: {value: null, descriptor: "End"},
            36: {value: null, descriptor: "Home"},
            37: {value: null, descriptor: "ArrowLeft"},
            38: {value: null, descriptor: "ArrowUp"},
            39: {value: null, descriptor: "ArrowRight"},
            40: {value: null, descriptor: "ArrowDown"},
            
            44: {value: null, descriptor: "PrintScreen"},
            45: {value: null, descriptor: "Insert"},
            46: {value: null, descriptor: "Delete"},

            48: {value: "0", shiftValue: ")", descriptor: "Digit0", shiftDescriptor: "CloseParens"},
            49: {value: "1", shiftValue: "!", descriptor: "Digit1", shiftDescriptor: "ExclamationMark"},
            50: {value: "2", shiftValue: "@", descriptor: "Digit2", shiftDescriptor: "AtSymbol"},
            51: {value: "3", shiftValue: "#", descriptor: "Digit3", shiftDescriptor: "HashSymbol"},
            52: {value: "4", shiftValue: "$", descriptor: "Digit4", shiftDescriptor: "DollarSymbol"},
            53: {value: "5", shiftValue: "%", descriptor: "Digit5", shiftDescriptor: "PercentSymbol"},
            54: {value: "6", shiftValue: "^", descriptor: "Digit6", shiftDescriptor: "PowerOfSymbol"},
            55: {value: "7", shiftValue: "&", descriptor: "Digit7", shiftDescriptor: "Ampersand"},
            56: {value: "8", shiftValue: "*", descriptor: "Digit8", shiftDescriptor: "Ampersand"},
            57: {value: "9", shiftValue: "(", descriptor: "Digit9", shiftDescriptor: "OpenParens"},

            65: {value: "a", shiftValue: "A", descriptor: "KeyA", shiftDescriptor: "Letter(A)"},
            66: {value: "b", shiftValue: "B", descriptor: "KeyB", shiftDescriptor: "Letter(B)"},
            67: {value: "c", shiftValue: "C", descriptor: "KeyC", shiftDescriptor: "Letter(C)"},
            68: {value: "d", shiftValue: "D", descriptor: "KeyD", shiftDescriptor: "Letter(D)"},
            69: {value: "e", shiftValue: "E", descriptor: "KeyE", shiftDescriptor: "Letter(E)"},
            70: {value: "f", shiftValue: "F", descriptor: "KeyF", shiftDescriptor: "Letter(F)"},
            71: {value: "g", shiftValue: "G", descriptor: "KeyG", shiftDescriptor: "Letter(G)"},
            72: {value: "h", shiftValue: "H", descriptor: "KeyH", shiftDescriptor: "Letter(H)"},
            73: {value: "i", shiftValue: "I", descriptor: "KeyI", shiftDescriptor: "Letter(I)"},
            74: {value: "j", shiftValue: "J", descriptor: "KeyJ", shiftDescriptor: "Letter(J)"},
            75: {value: "k", shiftValue: "K", descriptor: "KeyK", shiftDescriptor: "Letter(K)"},
            76: {value: "l", shiftValue: "L", descriptor: "KeyL", shiftDescriptor: "Letter(L)"},
            77: {value: "m", shiftValue: "M", descriptor: "KeyM", shiftDescriptor: "Letter(M)"},
            78: {value: "n", shiftValue: "N", descriptor: "KeyN", shiftDescriptor: "Letter(N)"},
            79: {value: "o", shiftValue: "O", descriptor: "KeyO", shiftDescriptor: "Letter(O)"},
            80: {value: "p", shiftValue: "P", descriptor: "KeyP", shiftDescriptor: "Letter(P)"},
            81: {value: "q", shiftValue: "Q", descriptor: "KeyQ", shiftDescriptor: "Letter(Q)"},
            82: {value: "r", shiftValue: "R", descriptor: "KeyR", shiftDescriptor: "Letter(R)"},
            83: {value: "s", shiftValue: "S", descriptor: "KeyS", shiftDescriptor: "Letter(S)"},
            84: {value: "t", shiftValue: "T", descriptor: "KeyT", shiftDescriptor: "Letter(T)"},
            85: {value: "u", shiftValue: "U", descriptor: "KeyU", shiftDescriptor: "Letter(U)"},
            86: {value: "v", shiftValue: "V", descriptor: "KeyV", shiftDescriptor: "Letter(V)"},
            87: {value: "w", shiftValue: "W", descriptor: "KeyW", shiftDescriptor: "Letter(W)"},
            88: {value: "x", shiftValue: "X", descriptor: "KeyX", shiftDescriptor: "Letter(X)"},
            89: {value: "y", shiftValue: "Y", descriptor: "KeyY", shiftDescriptor: "Letter(Y)"},
            90: {value: "z", shiftValue: "Z", descriptor: "KeyZ", shiftDescriptor: "Letter(Z)"},

            96: {value: "0", descriptor: "Numpad0"},
            97: {value: "1", descriptor: "Numpad1"},
            98: {value: "2", descriptor: "Numpad2"},
            99: {value: "3", descriptor: "Numpad3"},
            100: {value: "4", descriptor: "Numpad4"},
            101: {value: "5", descriptor: "Numpad5"},
            102: {value: "6", descriptor: "Numpad6"},
            103: {value: "7", descriptor: "Numpad7"},
            104: {value: "8", descriptor: "Numpad8"},
            105: {value: "9", descriptor: "Numpad9"},
            106: {value: "*", descriptor: "NumpadMultiply"},
            107: {value: "+", descriptor: "NumpadAdd"},
            109: {value: "-", descriptor: "NumpadSubtract"},
            110: {value: ".", descriptor: "NumpadDecimal"},
            111: {value: "/", descriptor: "NumpadDivide"},

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
            124: {value: null, descriptor: "F13"},
            125: {value: null, descriptor: "F14"},
            126: {value: null, descriptor: "F15"},
            127: {value: null, descriptor: "F16"},
            128: {value: null, descriptor: "F17"},
            129: {value: null, descriptor: "F18"},
            130: {value: null, descriptor: "F19"},
            131: {value: null, descriptor: "F20"},
            132: {value: null, descriptor: "F21"},
            133: {value: null, descriptor: "F22"},
            134: {value: null, descriptor: "F23"},
            135: {value: null, descriptor: "F24"},
            
            144: {value: null, descriptor: "NumLock"},
            145: {value: null, descriptor: "ScrollLock"},

            //these are UK keyboard defaults - not important unless we're trying to follow typing
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



    

    

    
    
    
    
   

   
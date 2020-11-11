//this is only used to translate key events etc. into a human readable string
//for the actual commands we only need to have the key that's pressed and the target

//YouTube keyboard shortcuts for testing keyboard record / replay in iframes
//Press the spacebar or the 'K' key on your keyboard to play and pause a video.
//Pressing the '0' (zero) key on your keyboard will jump to the beginning of a video. The Home key also works for jumping to the start of a video.
//Pressing the End key on your keyboard will go to the end of the video.

class KeyCodeDictionary {
    //pass in an options object which can take new languages
    constructor(options) {
        // set default values for the keycodes class - UK keyboard
        const defaults = {
            8: {
                value: null,
                descriptor: 'Backspace',
                cypressDescriptor: '{backspace}',
                testingLibraryDescriptor: '{backspace}',
            },
            9: { value: null, descriptor: 'Tab' },

            13: {
                value: null,
                descriptor: 'Enter',
                cypressDescriptor: '{enter}',
                testingLibraryDescriptor: '{enter}',
            },

            16: { value: null, descriptor: 'Shift' },
            17: { value: null, descriptor: 'Control' },
            18: { value: null, descriptor: 'Alt' },
            19: { value: null, descriptor: 'Pause' },
            20: { value: null, descriptor: 'CapsLock' },

            27: {
                value: null,
                descriptor: 'Escape',
                cypressDescriptor: '{esc}',
                testingLibraryDescriptor: '{esc}',
            },

            32: { value: ' ', descriptor: 'Space' },
            33: { value: null, descriptor: 'PageUp', cypressDescriptor: '{pageup}' },
            34: { value: null, descriptor: 'PageDown', cypressDescriptor: '{pagedown}' },
            35: { value: null, descriptor: 'End', cypressDescriptor: '{end}' },
            36: { value: null, descriptor: 'Home', cypressDescriptor: '{home}' },
            37: {
                value: null,
                descriptor: 'ArrowLeft',
                cypressDescriptor: '{leftarrow}',
                testingLibraryDescriptor: '{arrowleft}',
            },
            38: { value: null, descriptor: 'ArrowUp', cypressDescriptor: '{uparrow}' },
            39: {
                value: null,
                descriptor: 'ArrowRight',
                cypressDescriptor: '{rightarrow}',
                testingLibraryDescriptor: '{arrowright}',
            },
            40: { value: null, descriptor: 'ArrowDown', cypressDescriptor: '{downarrow}' },

            44: { value: null, descriptor: 'PrintScreen' },
            45: { value: null, descriptor: 'Insert', cypressDescriptor: '{insert}' },
            46: { value: null, descriptor: 'Delete', cypressDescriptor: '{del}', testingLibraryDescriptor: '{del}' },

            48: { value: '0', shiftValue: ')', descriptor: 'Digit0', shiftDescriptor: 'CloseParens' },
            49: { value: '1', shiftValue: '!', descriptor: 'Digit1', shiftDescriptor: 'ExclamationMark' },
            50: { value: '2', shiftValue: '@', descriptor: 'Digit2', shiftDescriptor: 'AtSymbol' },
            51: { value: '3', shiftValue: '#', descriptor: 'Digit3', shiftDescriptor: 'HashSymbol' },
            52: { value: '4', shiftValue: '$', descriptor: 'Digit4', shiftDescriptor: 'DollarSymbol' },
            53: { value: '5', shiftValue: '%', descriptor: 'Digit5', shiftDescriptor: 'PercentSymbol' },
            54: { value: '6', shiftValue: '^', descriptor: 'Digit6', shiftDescriptor: 'PowerOfSymbol' },
            55: { value: '7', shiftValue: '&', descriptor: 'Digit7', shiftDescriptor: 'Ampersand' },
            56: { value: '8', shiftValue: '*', descriptor: 'Digit8', shiftDescriptor: 'Ampersand' },
            57: { value: '9', shiftValue: '(', descriptor: 'Digit9', shiftDescriptor: 'OpenParens' },

            65: { value: 'a', shiftValue: 'A', descriptor: 'KeyA', shiftDescriptor: 'Letter(A)' },
            66: { value: 'b', shiftValue: 'B', descriptor: 'KeyB', shiftDescriptor: 'Letter(B)' },
            67: { value: 'c', shiftValue: 'C', descriptor: 'KeyC', shiftDescriptor: 'Letter(C)' },
            68: { value: 'd', shiftValue: 'D', descriptor: 'KeyD', shiftDescriptor: 'Letter(D)' },
            69: { value: 'e', shiftValue: 'E', descriptor: 'KeyE', shiftDescriptor: 'Letter(E)' },
            70: { value: 'f', shiftValue: 'F', descriptor: 'KeyF', shiftDescriptor: 'Letter(F)' },
            71: { value: 'g', shiftValue: 'G', descriptor: 'KeyG', shiftDescriptor: 'Letter(G)' },
            72: { value: 'h', shiftValue: 'H', descriptor: 'KeyH', shiftDescriptor: 'Letter(H)' },
            73: { value: 'i', shiftValue: 'I', descriptor: 'KeyI', shiftDescriptor: 'Letter(I)' },
            74: { value: 'j', shiftValue: 'J', descriptor: 'KeyJ', shiftDescriptor: 'Letter(J)' },
            75: { value: 'k', shiftValue: 'K', descriptor: 'KeyK', shiftDescriptor: 'Letter(K)' },
            76: { value: 'l', shiftValue: 'L', descriptor: 'KeyL', shiftDescriptor: 'Letter(L)' },
            77: { value: 'm', shiftValue: 'M', descriptor: 'KeyM', shiftDescriptor: 'Letter(M)' },
            78: { value: 'n', shiftValue: 'N', descriptor: 'KeyN', shiftDescriptor: 'Letter(N)' },
            79: { value: 'o', shiftValue: 'O', descriptor: 'KeyO', shiftDescriptor: 'Letter(O)' },
            80: { value: 'p', shiftValue: 'P', descriptor: 'KeyP', shiftDescriptor: 'Letter(P)' },
            81: { value: 'q', shiftValue: 'Q', descriptor: 'KeyQ', shiftDescriptor: 'Letter(Q)' },
            82: { value: 'r', shiftValue: 'R', descriptor: 'KeyR', shiftDescriptor: 'Letter(R)' },
            83: { value: 's', shiftValue: 'S', descriptor: 'KeyS', shiftDescriptor: 'Letter(S)' },
            84: { value: 't', shiftValue: 'T', descriptor: 'KeyT', shiftDescriptor: 'Letter(T)' },
            85: { value: 'u', shiftValue: 'U', descriptor: 'KeyU', shiftDescriptor: 'Letter(U)' },
            86: { value: 'v', shiftValue: 'V', descriptor: 'KeyV', shiftDescriptor: 'Letter(V)' },
            87: { value: 'w', shiftValue: 'W', descriptor: 'KeyW', shiftDescriptor: 'Letter(W)' },
            88: { value: 'x', shiftValue: 'X', descriptor: 'KeyX', shiftDescriptor: 'Letter(X)' },
            89: { value: 'y', shiftValue: 'Y', descriptor: 'KeyY', shiftDescriptor: 'Letter(Y)' },
            90: { value: 'z', shiftValue: 'Z', descriptor: 'KeyZ', shiftDescriptor: 'Letter(Z)' },

            96: { value: '0', descriptor: 'Numpad0' },
            97: { value: '1', descriptor: 'Numpad1' },
            98: { value: '2', descriptor: 'Numpad2' },
            99: { value: '3', descriptor: 'Numpad3' },
            100: { value: '4', descriptor: 'Numpad4' },
            101: { value: '5', descriptor: 'Numpad5' },
            102: { value: '6', descriptor: 'Numpad6' },
            103: { value: '7', descriptor: 'Numpad7' },
            104: { value: '8', descriptor: 'Numpad8' },
            105: { value: '9', descriptor: 'Numpad9' },
            106: { value: '*', descriptor: 'NumpadMultiply' },
            107: { value: '+', descriptor: 'NumpadAdd' },
            109: { value: '-', descriptor: 'NumpadSubtract' },
            110: { value: '.', descriptor: 'NumpadDecimal' },
            111: { value: '/', descriptor: 'NumpadDivide' },

            112: { value: null, descriptor: 'F1' },
            113: { value: null, descriptor: 'F2' },
            114: { value: null, descriptor: 'F3' },
            115: { value: null, descriptor: 'F4' },
            116: { value: null, descriptor: 'F5' },
            117: { value: null, descriptor: 'F6' },
            118: { value: null, descriptor: 'F7' },
            119: { value: null, descriptor: 'F8' },
            120: { value: null, descriptor: 'F9' },
            121: { value: null, descriptor: 'F10' },
            122: { value: null, descriptor: 'F11' },
            123: { value: null, descriptor: 'F12' },
            124: { value: null, descriptor: 'F13' },
            125: { value: null, descriptor: 'F14' },
            126: { value: null, descriptor: 'F15' },
            127: { value: null, descriptor: 'F16' },
            128: { value: null, descriptor: 'F17' },
            129: { value: null, descriptor: 'F18' },
            130: { value: null, descriptor: 'F19' },
            131: { value: null, descriptor: 'F20' },
            132: { value: null, descriptor: 'F21' },
            133: { value: null, descriptor: 'F22' },
            134: { value: null, descriptor: 'F23' },
            135: { value: null, descriptor: 'F24' },

            144: { value: null, descriptor: 'NumLock' },
            145: { value: null, descriptor: 'ScrollLock' },

            //these are UK keyboard defaults - not important unless we're trying to follow typing
            186: { value: ';', shiftValue: ':', descriptor: 'SemiColon', shiftDescriptor: 'Colon' },
            187: { value: ',', shiftValue: '+', descriptor: 'Equals', shiftDescriptor: 'Plus' },
            188: { value: ',', shiftValue: '<', descriptor: 'Comma', shiftDescriptor: 'LessThan' },
            189: { value: '-', shiftValue: '_', descriptor: 'Dash', shiftDescriptor: 'UnderScore' },
            190: { value: '.', shiftValue: '>', descriptor: 'Period', shiftDescriptor: 'GreaterThan' },
            191: { value: '/', shiftValue: '?', descriptor: 'ForwardSlash', shiftDescriptor: 'QuestionMark' },
            192: { value: '`', shiftValue: '~', descriptor: 'BackTick', shiftDescriptor: 'ApproxSign' },

            219: { value: '[', shiftValue: '{', descriptor: 'OpenBracket', shiftDescriptor: 'OpenBrace' },
            220: { value: '\\', shiftValue: '|', descriptor: 'BackSlash', shiftDescriptor: 'Divider' },
            221: { value: ']', shiftValue: '}', descriptor: 'CloseBracket', shiftDescriptor: 'CloseBrace' },
            222: { value: "'", shiftValue: '"', descriptor: 'SingleQuote', shiftDescriptor: 'DoubleQuote' },
        };

        // create a new object with the defaults over-ridden by the options passed in
        let opts = Object.assign({}, defaults, options);

        // assign options to instance data (using only property names contained in defaults object to avoid copying properties we don't want)
        Object.keys(defaults).forEach((prop) => {
            this[prop] = opts[prop];
        });
    }

    //here we have a helper function to generate the object required by the Chrome Devtools Protocol
    generateDispatchKeyEvent = (keyEvent) => {
        //first we need to get the modifiers
        const modifiers = this.getModifiers(keyEvent);
        //then we need to know if shift was pressed
        const shiftPressed = keyEvent.shiftKey;
        //then we need to work out the text value by looking up the value in the dictionary
        const definition = this[keyEvent.keyCode];
        //then create the text variable and set it to an empty string by default
        var definitionText = '';
        //then get the standard text from the definition, if it has any
        if (definition.value) {
            //only certain keys produce a character value
            definitionText = definition.value;
        }
        //then if shift is pressed we get the shifted text from the definition, if it has any
        if (shiftPressed && definition.shiftValue) {
            //only certain keys produce a character shift value
            definitionText = definition.shiftValue;
        }
        // if any modifiers besides shift are pressed, no text should be sent
        if (modifiers & ~8) {
            //reset it to default
            definitionText = '';
        }
        //then we return the object that is compatible with the Chrome Devtools Protocol Input.dispatchKeyEvent
        return {
            //NOTE - WE DEFINE KEY DOWN OR RAW KEY DOWN HERE - FOR KEY UP WE NEED TO CHANGE
            //String Type of the key event keyDown, keyUp, rawKeyDown, char
            type: definitionText ? 'keyDown' : 'rawKeyDown',
            //Bit field integer representing pressed modifier keys. Alt=1, Ctrl=2, Meta/Command=4, Shift=8 (default: 0).
            modifiers: modifiers,
            //integer Windows virtual key code (default: 0).
            windowsVirtualKeyCode: keyEvent.keyCode,
            //Unique DOM defined string value for each physical key (e.g., 'KeyA') (default: "").
            code: keyEvent.code,
            //Unique DOM defined string value describing the meaning of the key in the context of active modifiers, keyboard layout, etc (e.g., 'AltGr') (default: "").
            key: keyEvent.key,
            //String Text as generated by processing a virtual key code with a keyboard layout. Not needed for for keyUp and rawKeyDown events (default: "")
            text: definitionText,
            //String Text that would have been generated by the keyboard if no modifiers were pressed (except for shift). Useful for shortcut (accelerator) key handling (default: "").
            unmodifiedText: definitionText,
            //boolean Whether the event was generated from auto repeat (default: false).
            autoRepeat: keyEvent.repeat,
            //boolean Whether the event was generated from the keypad (default: false).
            isKeypad: this[keyEvent.keyCode].descriptor && this[keyEvent.keyCode].descriptor.includes('Numpad'),
            //integer Whether the event was from the left or right side of the keyboard. 1=Left, 2=Right (default: 0).
            location: keyEvent.location,
        };
    };

    getModifiers = (keyEvent) => {
        switch (true) {
            case keyEvent.altKey:
                return 1;
            case keyEvent.ctrlKey:
                return 2;
            case keyEvent.metaKey:
                return 4;
            case keyEvent.shiftKey:
                return 8;
            default:
                return 0;
        }
    };
}

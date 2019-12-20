class CypressTranslator {

    //pass in an options object which can take new languages
    constructor(options) {
        
        // set default values for the keycodes class 
        const defaults = {

            //internal defaults
            replayTestUrl: "",
            replayTestID: 0,
            //need a keycode dictionary 
            keyCodeDictionary: new KeyCodeDictionary
            //messaging for code

        }
        // create a new object with the defaults over-ridden by the options passed in
        let opts = Object.assign({}, defaults, options);
  
        // assign options to instance data (using only property names contained in defaults object to avoid copying properties we don't want)
        Object.keys(defaults).forEach(prop => { this[prop] = opts[prop]; });
    }

    //FORMATTING
    openCypressTest = replay => `describe('${replay.recordingTestName}', function () {\n`

    openCypressReplay = replay => `\n\tit('${replay.replayName}', function () {\n`

    warnOnIframe = (href) => `\n\t\t// THIS ACTION MUST BE EXECUTED IN CONTEXT OF IFRAME WITH ORIGIN: ${new URL(href).origin}`

    //Cypress tests have an extra tab for formatting as everything takes place in a describe AND an it function
    tabIndex = index => {
        switch(index) {
            //for one extra tab, we use -1
            case -1: return '\n\t\t\t';
            //for two extra tabs we use -2
            case -2: return '\n\t\t\t\t';
            //for any element above zero, we use normal tabbing
            default: return '\n\t\t';
        }
    }

    closeCypressReplay = () => `\n\t]);\n`

    closeCypressTest = () => `\n]);`

    //in Cypress, The modifier(s) remain activated for the duration of the .type() command, and are released when all subsequent characters are typed, 
    mapDispatchKeyEventModifer = (modifier) => {
        switch(modifier) {
            case 1: return "{alt}"
            case 2: return "{ctrl}"
            case 4: return "{meta}"
            case 8: return "{shift}"
            default: return ""
        }
    }

    //ACTION FUNCTIONS



    navigateStartAndConfirm = (replay) => `${this.tabIndex(0)}cy.visit('${replay.replayRecordingStartUrl}');\n`;

    mouseClick = (selector, clicktype) => {
        switch(clicktype) {
            case 'click': return `cy.get('${selector}').click();`
            case 'dblclick': return `cy.get('${selector}').dblclick();`
            case 'contextmenu': return `cy.get('${selector}').rightclick();`
            default: return `${this.tabIndex(index)}//No Click Action Available For Action ${clicktype}`
        }
    }

    recaptcha = (selector) => `cy.get('${selector}').click();`

    inputText = (selector, text) => `cy.get('${selector}').type('${text}');` 
    
    nonInputTyping = (selector, replayEvent) => {

        //so there is some complexity in handling the different types of typing
        //first we need to know if the typing event contains characters or not
        const dictionaryEntry = this.keyCodeDictionary[replayEvent.recordingEventDispatchKeyEvent.windowsVirtualKeyCode];
        //then we need to warn that tabbing does not work in Cypress
        if (dictionaryEntry.descriptor == "Tab") {
            return `// Cypress does not support the use of ${dictionaryEntry.descriptor} key in tests`;
        }
        //then we need to warn if we do not have a Cypress descriptor for a null value key
        if (dictionaryEntry.value == null && !dictionaryEntry.hasOwnProperty('cypressDescriptor')) {
            return `// Cypress does not support the use of ${dictionaryEntry.descriptor} key in tests`;
        }
        //then we want to know if there are any modifier keys pressed at the time
        const modifiers = this.mapDispatchKeyEventModifer(replayEvent.recordingEventDispatchKeyEvent.modifiers);
        //then we want know if there is any text attached to the keyboard event
        const text = replayEvent.recordingEventDispatchKeyEvent.text;
        //then we want to know if the text contains the '{' or '}' keys so we can add the option to ignore special characters
        const options = (text.includes('{') || text.includes('}') ? ', { parseSpecialCharSequences: false }' : '');
        //if the dictionary entry has a value of null, we need to send the cypress special character sequences, with modifiers
        if (dictionaryEntry.value == null) {
            //how we execute this depends on whether the typing was done on an element or the main document
            if (replayEvent.recordingEventHTMLTag == "HTML") {
                //Cypress demands that the main document typing occurs on the body
                return `cy.get('body').type('${modifiers}${dictionaryEntry.cypressDescriptor}');`
            } else {
                //otherwise we use the main selector
                return `cy.get('${selector}').type('${modifiers}${dictionaryEntry.cypressDescriptor}');`
            }
        } else {
            //how we execute this depends on whether the typing was done on an element or the main document
            if (replayEvent.recordingEventHTMLTag == "HTML") {
                //Cypress demands that the main document typing occurs on the body
                return `cy.get('body').type('${modifiers}${text}'${options});`
            } else {
                //otherwise we use the main selector
                return `cy.get('${selector}').type('${modifiers}${text}'${options});`
            }
        }
    }

    scrollTo = (xPosition, yPosition) => `cy.scrollTo(${xPosition}, ${yPosition});`

    elementScrollTo = (selector, xPosition, yPosition) => `cy.get('${selector}').scrollTo(${xPosition}, ${yPosition});`

    focus = (selector) => `cy.get('${selector}').focus();`

    hover = (selector) => `cy.get('${selector}').trigger('mouseover');`

    textSelect = (selector) => `cy.get('${selector}').type('{selectall}');`

    //ASSERTION FUNCTIONS
    navigationAssertion = replayEvent => `cy.url().should('include', '${replayEvent.recordingEventLocationHref}');`

    visibleAssertion = selector => `cy.get('${selector}').should('be.visible');`

    textAssertion = (selector, assertionEvent) => `cy.get('${selector}').should('contain', '${assertionEvent.assertionValue}');`

    hasAttributeAssertion = (selector, assertionEvent) => `cy.get('${selector}').should('have.attr', '${assertionEvent.assertionAttribute}');`

    hasAttributeValueAssertion = (selector, assertionEvent) => `cy.get('${selector}').should('have.attr', '${assertionEvent.assertionAttribute}', '${assertionEvent.assertionValue}');`

    //SELECTOR HELPERS
    getMostValidSelector = replayEvent => {

        //if we have run the replay, we will get a report on the selector that was chosen
        if (replayEvent.replayChosenSelectorString && replayEvent.replayChosenSelectorString.length > 0) {
            return replayEvent.replayChosenSelectorString;
        }
        //if we have run the assertion, we will get a report on the selector that was chosen
        if (replayEvent.assertionChosenSelectorString && replayEvent.assertionChosenSelectorString.length > 0) {
            return replayEvent.assertionChosenSelectorString;
        }
        //otherwise collect all the existing selectors into an array, filter and return the first valid one
        return [
            replayEvent.recordingEventCssSelectorPath, 
            replayEvent.recordingEventCssFinderPath, 
            replayEvent.recordingEventCssDomPath
        ]
        //when we filter we need to know what the selectors return when they fail
        .filter(value => value != false && value != 'undefined' && value != null)[0] || ""; 

    }

    mapActionTypeToFunction = (replayEvent, index) => {

        //then we need to create an array that we can push our strings into then join them at the end
        let outputStringArray = [];
        //then we need to accommodate replay events and assertion events
        const action = replayEvent.assertionEventAction || replayEvent.recordingEventAction;

        //then we need to determine the type of recording event action so we can deliver the right piece of code to the text area
        switch(action) {
            //mouse actions can have many variants so we need a subswitch
            case "Mouse":
                //here we switch on type of action
                switch(replayEvent.recordingEventActionType) {
                    case "hover":
                        //in the case of hover, we get the most valid selector and then push the string result of the hover selctor into the array 
                        outputStringArray.push(this.hover(this.getMostValidSelector(replayEvent)));
                        break;
                    case "recaptcha":
                        //recaptcha is different in recording terms as the event we listen to is not the event we replay - click to replay 
                        outputStringArray.push(this.recaptcha(this.getMostValidSelector(replayEvent)));
                        break;
                    default:
                        //then we have the default, which handles all the standard clicks, including 'click', 'dblclick' and 'contextmenu'
                        outputStringArray.push(this.mouseClick(this.getMostValidSelector(replayEvent), replayEvent.recordingEventActionType));
                }
                break;
                case "Scroll":
                    outputStringArray.push(this.scrollTo(replayEvent.recordingEventXPosition, replayEvent.recordingEventYPosition));
                    break;
                case "ElementScroll":
                    outputStringArray.push(this.elementScrollTo(this.getMostValidSelector(replayEvent), replayEvent.recordingEventXPosition, replayEvent.recordingEventYPosition));
                    break;
                case "TextSelect":
                    outputStringArray.push(this.textSelect(this.getMostValidSelector(replayEvent)));
                    break;
                case "Keyboard": 
                    outputStringArray.push(this.nonInputTyping(this.getMostValidSelector(replayEvent), replayEvent));
                    break;
                case 'Input':
                    outputStringArray.push(this.focus(this.getMostValidSelector(replayEvent)) += this.tabIndex(index) + this.inputText(replayEvent.recordingEventInputValue));
                    break;
                case 'Page':
                    outputStringArray.push(this.navigationAssertion(replayEvent))
                    break;
                case 'Assertion':
                    //here we switch on type of assertion, this is determined by the clicks on the checkboxes
                    //checkboxes are created by nodebuilder and then added by listening to clicks on checboxes in newReplay.js
                    switch(replayEvent.assertionType) {
                        case "Visible":
                            outputStringArray.push(this.visibleAssertion(this.getMostValidSelector(replayEvent)));
                            break;
                        case "Text Content":
                            outputStringArray.push(this.textAssertion(this.getMostValidSelector(replayEvent), replayEvent));
                            break;
                        case "Present": 
                            outputStringArray.push(this.hasAttributeAssertion(this.getMostValidSelector(replayEvent), replayEvent));
                            break;
                        case "Content":
                            outputStringArray.push(this.hasAttributeValueAssertion(this.getMostValidSelector(replayEvent), replayEvent));
                            break;
                        default:
                            return `${this.tabIndex(index)}//No Mapping Type in Puppeteer for Action ${replayEvent.assertionType}`; 
                    }
                    break;
                default:
                    console.log(`No Mapping for Action Type ${replayEvent.recordingEventAction}`);
                    //here we do a simple return with the indented tabbing so it falls in the same place as the action
                    return `${this.tabIndex(index)}//No Mapping Type in Puppeteer for Action ${replayEvent.recordingEventAction}`; 
        }

        //then if we reach this point we need to mao the string array, with a tabbing element for formatting
        outputStringArray = outputStringArray.map(string => `${this.tabIndex(index)}${string}`);
        //then we need to return the string
        return outputStringArray.join('');

    }

    buildReplayStringFromEvents = replay => {

        //start with an empty string
        var outputString = "";
        //add the standard Cypress opening function
        outputString += this.openCypressTest(replay);
        //add the standard browser warning
        outputString += this.openCypressReplay(replay);
        //add the open page function
        outputString += this.navigateStartAndConfirm(replay);
        //then we determine if we are working with a replay that has been run or not, we start with the replay event array by default
        var eventsArray = replay.replayEventArray;
        //then if we have a good replay
        if (replay.replayStatus) { eventsArray = replay.mutatedReplayEventArray }
        //then we loop through the array
        for (let event in eventsArray) { 
            //then add the iframe warning if required
            eventsArray[event].recordingEventIsIframe ? outputString += this.warnOnIframe(eventsArray[event].recordingEventLocationHref) : null;
            //then add the string using the action mapped to function
            outputString += `${this.mapActionTypeToFunction(eventsArray[event], event)}\n`;
        }
        //add the close page function
        outputString += this.closeCypressReplay();
        //add the standard async closing function
        outputString += this.closeCypressTest();
        //return the string
        return outputString;

    }

}
class JestTranslator {

    //pass in an options object which can take new languages
    constructor(options) {
        
        // set default values for the keycodes class 
        const defaults = {

            //internal defaults
            replayTestUrl: "",
            replayTestID: 0,
            //need an attached translator, which we can check using instanceOf
            chosenTranslator: options.translator == "Puppeteer" ? new PuppeteerTranslator({}) : new SeleniumTranslator({})

        }
        // create a new object with the defaults over-ridden by the options passed in
        let opts = Object.assign({}, defaults, options);
  
        // assign options to instance data (using only property names contained in defaults object to avoid copying properties we don't want)
        Object.keys(defaults).forEach(prop => { this[prop] = opts[prop]; });
    }

    //FORMATTING FUNCTIONS

    //set up global browser variable
    defineBrowser = () => 'let browser'

    //this is where we need to do all set up operations
    beforeAllAsyncOpenFunction = () => 'beforeAll(async () => {'

    //after set up complete then close the function
    beforeAllAsyncCloseFunction = () => '});'

    //this is where we need to do all clean up operations
    afterAllAsyncOpenFunction = () => 'afterAll(async () => {'

    //after clean up complete then close the function
    afterAllAsyncCloseFunction = () => '});'

    openJestTest = replay => `describe('${replay.recordingTestName}', function () {\n`

    closeJestTest = () => `\n]);`

    openJestReplay = replay => `\n\tit('${replay.replayName}', async () => {\n`

    closeJestReplay = () => `\n]);`

    openTimedFunction = () => `\n\tawait new Promise(resolve => window.setTimeout(() => {`

    closeTimedFunction = (delay) => `\n\t\tresolve(); \n\t}, ${delay}));\n`

    tabbingStripper = string => string.replace( /[\r\n]+/gm, "") 

    tabIndex = index => {
        switch(index) {
            //for the first element in any recording event array, we do not need the timing so we don't need the indentation
            case 0: return '\n\t';
            //for one extra tab, we use -1
            case -1: return '\n\t\t\t';
            //for two extra tabs we use -2
            case -2: return '\n\t\t\t\t';
            //for any element above zero, we use normal tabbing
            default: return '\n\t\t';
        }
    }

    //ALL ACTIONS ARE CALLED BY REFERENCE TO THE CHOSEN TRANSLATOR SO WE NEED TO HAVE EXACT MATCHES FOR ALL FUNCTIONALITY 

    //ASSERTION FUNCTIONS
    navigationAssertion = (replayEvent, index) => `const navigation${index} = ${this.chosenTranslator.getPageUrl()} ${this.tabIndex(index)} expect(navigation${index}).toMatch(${replayEvent.recordingEventLocationHref});`

    visibleAssertion = (selector, index) => `const visibleAssertion${index} = ${this.chosenTranslator.getVisibleElement(selector)} ${this.tabIndex(index)} expect(visibleAssertion${index}).toBeTruthy();`

    textAssertion = (selector, assertionEvent, index) => `const textAssertion${index} = ${this.chosenTranslator.getElementText(selector)} ${this.tabIndex(index)} expect(textAssertion${index}).toMatch(${assertionEvent.assertionValue});`

    hasAttributeAssertion = (selector, assertionEvent, index) => `const hasAttribute${index} = ${this.chosenTranslator.getElementAttribute(selector, assertionEvent.assertionAttribute)} ${this.tabIndex(index)} expect(hasAttribute${index}).toBeTruthy();`

    hasAttributeValueAssertion = (selector, assertionEvent, index) => `const hasAttributeValue${index} = ${this.chosenTranslator.getElementAttributeValue(selector, assertionEvent.assertionAttribute)} ${this.tabIndex(index)} expect(hasAttributeValue${index}).toMatch(${assertionEvent.assertionValue});`

    



}
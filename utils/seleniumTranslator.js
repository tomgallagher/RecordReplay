class SeleniumTranslator {

    //pass in an options object which can take new languages
    constructor(options) {
        
        // set default values for the keycodes class 
        const defaults = {

            //internal defaults
            replayTestUrl: "",
            replayTestID: 0,
            //need a keycode dictionary 
            keyCodeDictionary: new KeyCodeDictionary,

        }
        // create a new object with the defaults over-ridden by the options passed in
        let opts = Object.assign({}, defaults, options);
  
        // assign options to instance data (using only property names contained in defaults object to avoid copying properties we don't want)
        Object.keys(defaults).forEach(prop => { this[prop] = opts[prop]; });

    }


    //FORMATTING FUNCTIONS

    openAnonAsyncFunction = () => `(async () => { \n`

    closeAnonAsyncFunction = () => `\n})();`

    openTimedFunction = () => `\n\tawait new Promise(resolve => window.setTimeout(() => {`

    closeTimedFunction = (delay) => `\n\t\tresolve(); \n\t}, ${delay}));\n`

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


    //BROWSER CONTROL ACTIONS

    openPage = () => `${this.tabIndex(0)}const driver = await new Builder().forBrowser('chrome').build();\n`

    navigateToUrl = url => `${this.tabIndex(0)}await driver.get('${url}');\n`

    returnScreenshot = () => `${this.tabIndex(0)}await driver.takeScreenshot();\n` 

    closePage = () => `${this.tabIndex(0)}await driver.quit();\n`


    //ACTION FUNCTIONS

    mapDispatchKeyEventModifer = (modifier) => {
        switch(modifier) {
            case 1: return "Alt"
            case 2: return "Control"
            case 4: return "Meta"
            case 8: return "Shift"
            default: return ""
        }
    }

    mouseClick = (selector, clicktype, index) => {
        switch(clicktype) {
            case 'click': return `const target${index} = await driver.findElement(by.css('${selector}')); await driver.actions().click(target${index}).perform();`
            case 'dblclick': return `const target${index} = await driver.findElement(by.css('${selector}')); await driver.actions().doubleClick(target${index}).perform();`
            case 'contextmenu': return `const target${index} = await driver.findElement(by.css('${selector}')); await driver.actions().contextClick(target${index}).perform();`
            default: return `${this.tabIndex(index)}//No Click Action Available For Action ${clicktype}`
        }
    }

    recaptcha = (selector) => `const target${index} = await driver.findElement(by.css('${selector}')); await driver.actions().click(target${index}).perform();`

    scrollTo = (xPosition, yPosition) => `await driver.executeScript("document.documentElement.scrollTo({ left: ${xPosition}, top: ${yPosition}, behavior: 'smooth' });");`

    elementScrollTo = (selector, xPosition, yPosition) => `await driver.executeScript("document.querySelector('${selector}').scrollTo({ left: ${xPosition}, top: ${yPosition}, behavior: 'smooth' });");`

    focus = (selector) => `await driver.executeScript("document.querySelector('${selector}').focus({ preventScroll: false });");`

    hover = (selector) => `const hoverTarget${index} = await driver.findElement(by.css('${selector}')); await driver.actions().move(target${index}).perform();`

    textSelect = (selector, index) => `await driver.executeScript("const range${index} = document.createRange(); const referenceNode${index} = document.querySelector('${selector}'); range${index}.selectNode(referenceNode${index}); const currentSelection${index} = window.getSelection(); currentSelection${index}.removeAllRanges(); currentSelection${index}.addRange(range${index});");`


    //ASSERTIONS HELPERS, we need to have the index of each item in the Rx.js flow so we can have unique assertions

    getPageUrl = () => 'await driver.getCurrentUrl();'

    getPageTitle = () => `await driver.getTitle();`

    getElementText = (selector) => `await driver.findElement(by.css('${selector}')).getText();`

    getVisibleElement = (selector) => `await driver.findElement(by.css('${selector}')).isDisplayed();`

    querySelector = (selector) => `await driver.findElement(by.css('${selector}'));` 

    querySelectorAll = (selector) => `await driver.findElements(by.css('${selector}'));` 

    countElements = (selector) => `await new Promise(resolve => driver.findElements(by.css('${selector}')).then(elements => resolve(elements.length)));`

    getElementAttribute = (selector, attribute) => `await new Promise(resolve => driver.findElement(by.css('${selector}')).then(element => resolve(element[${attribute}])));`

    getElementAttributeValue = (selector, attribute) => `await new Promise(resolve => driver.findElement(by.css('${selector}')).then(element => resolve(element.getAttribute('${attribute}'))));`

    getElementAttributesAsArray = (selector) => `await new Promise(resolve => driver.findElement(by.css('${selector}')).then(element => Array.prototype.slice.call(element.attributes)));`


    //COMMAND GENERATION FUNCTIONS

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

        //set up the empty string
        let outputString = "";

        //then we need to determine the type of recording event action so we can deliver the right piece of code to the text area
        switch(replayEvent.recordingEventAction) {
            //mouse actions can have many variants so we need a subswitch
            case "Mouse":
                //here we switch on type of action
                switch(replayEvent.recordingEventActionType) {
                    case "hover":
                        //in the case of hover, we get the most valid selector and then push the string result of the hover selctor into the array 
                        outputString += this.hover(this.getMostValidSelector(replayEvent), target);
                        break;
                    case "recaptcha":
                        //recaptcha is different in recording terms as the event we listen to is not the event we replay - click to replay 
                        outputString += this.recaptcha(this.getMostValidSelector(replayEvent), target);
                        break;
                    default:
                        //then we have the default, which handles all the standard clicks, including 'click', 'dblclick' and 'contextmenu'
                        outputString += this.mouseClick(this.getMostValidSelector(replayEvent), replayEvent.recordingEventActionType, index, target);
                }
                break;
            //scroll has no particular solution in Puppeteer
            case "Scroll":
                outputString += this.scrollTo(replayEvent.recordingEventXPosition, replayEvent.recordingEventYPosition, index, target);
                break;
            case "ElementScroll":
                outputString += this.elementScrollTo(this.getMostValidSelector(replayEvent), replayEvent.recordingEventXPosition, replayEvent.recordingEventYPosition, index, target);
                break;
            //neither does text select
            case "TextSelect":
                outputString += this.textSelect(this.getMostValidSelector(replayEvent), index, target);
                break;
            case "Keyboard": 
                outputString += this.nonInputTyping(this.getMostValidSelector(replayEvent), replayEvent, index);
                break;
            case 'Input':
                if (recordingEvent.recordingEventInputType == "contentEditable") {
                    outputString += this.inputContentEditable(this.getMostValidSelector(replayEvent), replayEvent.recordingEventInputValue, target);
                } else {
                    outputString += this.focus(this.getMostValidSelector(replayEvent), target) += this.tabIndex(index) + this.typeText(replayEvent.recordingEventInputValue, target);
                }
                break;
            case 'Page':
                //here we just do a simple return with the standard tabbing
                return `${this.tabIndex(0)}// Page navigated to ${replayEvent.recordingEventLocationHref}`;
            default:
                console.log(`No Mapping for Action Type ${replayEvent.recordingEventAction}`);
                //here we do a simple return with the indented tabbing so it falls in the same place as the action
                return `${this.tabIndex(index)}//No Mapping Type in Puppeteer for Action ${replayEvent.recordingEventAction}`; 
        }

        //then we need to wrap any iframe commands, which returns an array
        let outputArray = this.wrapIframeCommand(replayEvent, index, outputString);
        //then if we reach this point we need to map the string array, with a tabbing element for formatting
        outputArray = outputArray.map(string => `${this.tabIndex(index)}${string}`);
        //then we need to return the string
        return outputArray.join('');

    }

    wrapIframeCommand = (replayEvent, index, commandString) => {

        //we need an array that we can concat
        let outputArray = [];
        //then we need to find out if the event has taken place in an iframe
        if (replayEvent.recordingEventIsIframe) {
            //first we need to get the details of the iframe we are going to be looking for
            const replayFrameUrl = new URL(replayEvent.recordingEventLocationHref)
            //then we need to get the origin and the path
            const replayFrameOrigin = replayFrameUrl.origin;
            const replayFramePath = replayFrameUrl.pathname;
            //then we need to find the frame using the origin and path and allocate it to our indexed frame
            const getFrameString = `const frame${index} = driver.findElement(By.xpath("//iframe[contains(@href, '${replayFrameOrigin}') and contains(@href, '${replayFramePath}')]"));`;
            //then push the frame string to the array
            outputArray.push(getFrameString);
            //then we need to switch focus to the frame
            const switchFocusString = `await driver.switchTo().frame(frame${index});`;
            //then push the focus string to the array
            outputArray.push(switchFocusString);
            //then we need to action the command by pushing it to the array
            outputArray.push(commandString);
            //then return to the top level
            const exitFrameString = 'await driver.switchTo().defaultContent();';
            outputArray.push(exitFrameString);
        } else {
            //otherwise we just push the string to the array
            outputArray.push(commandString);
        }
        return outputArray;

    }

}
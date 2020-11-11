class SeleniumTranslator {
    //pass in an options object which can take new languages
    constructor(options) {
        // set default values for the keycodes class
        const defaults = {
            //internal defaults
            replayTestUrl: '',
            replayTestID: 0,
            //need a keycode dictionary
            keyCodeDictionary: new KeyCodeDictionary(),
            //messaging for code
            standardOpeningComment:
                '\n\t/*\n' +
                '\t\t Your options for launching Selenium Webdriver will depend upon your system setup and preferences. \n' +
                "\t\t The following code depends upon you having successfully launched Selenium Webdriver with the reference 'driver'.\n" +
                "\t\t Don't forget to call 'driver.close()' at the end of your tests.\n" +
                '\t*/\n',
        };
        // create a new object with the defaults over-ridden by the options passed in
        let opts = Object.assign({}, defaults, options);

        // assign options to instance data (using only property names contained in defaults object to avoid copying properties we don't want)
        Object.keys(defaults).forEach((prop) => {
            this[prop] = opts[prop];
        });
    }

    //FORMATTING FUNCTIONS

    openAnonAsyncFunction = () => `(async () => { \n`;

    closeAnonAsyncFunction = () => `\n})();`;

    openTimedFunction = () => `\n\tawait new Promise(resolve => window.setTimeout(() => {`;

    closeTimedFunction = (delay) => `\n\t\tresolve(); \n\t}, ${delay}));\n`;

    tabIndex = (index) => {
        switch (index) {
            //for the first element in any recording event array, we do not need the timing so we don't need the indentation
            case 0:
                return '\n\t\t';
            //for one extra tab, we use -1
            case -1:
                return '\n\t\t\t';
            //for two extra tabs we use -2
            case -2:
                return '\n\t\t\t\t';
            //for any element above zero, we use normal tabbing
            default:
                return '\n\t\t\t';
        }
    };

    //BROWSER CONTROL ACTIONS

    openPage = () => `const driver = await new Builder().forBrowser('chrome').build();\n`;

    navigateToUrl = (url) => `await driver.get('${url}');\n`;

    returnScreenshot = () => `await driver.takeScreenshot();\n`;

    closePage = () => `await driver.quit();\n`;

    //ACTION FUNCTIONS

    mapDispatchKeyEventModifer = (modifier) => {
        switch (modifier) {
            case 1:
                return 'Alt';
            case 2:
                return 'Control';
            case 4:
                return 'Meta';
            case 8:
                return 'Shift';
            default:
                return '';
        }
    };

    mouseClick = (selector, clicktype, index) => {
        switch (clicktype) {
            case 'click':
                return `const target${index} = await driver.findElement(by.css('${selector}')); ${this.tabIndex(
                    1
                )}await driver.actions().click(target${index}).perform();`;
            case 'dblclick':
                return `const target${index} = await driver.findElement(by.css('${selector}'));  ${this.tabIndex(
                    1
                )}await driver.actions().doubleClick(target${index}).perform();`;
            case 'contextmenu':
                return `const target${index} = await driver.findElement(by.css('${selector}'));  ${this.tabIndex(
                    1
                )}await driver.actions().contextClick(target${index}).perform();`;
            default:
                return `${this.tabIndex(-1)}//No Click Action Available For Action ${clicktype}`;
        }
    };

    recaptcha = (selector, index) =>
        `const target${index} = await driver.findElement(by.css('${selector}')); await driver.actions().click(target${index}).perform();`;

    //we need a parser for the different kinds of input
    inputParser = (selector, recordingEvent, index) => {
        //first we need to get the value we need to input
        const value = recordingEvent.recordingEventInputValue;
        //then we need a shorthand for the input type
        const inputType = recordingEvent.recordingEventInputType;
        //then we need to work differently for different kinds of inputs
        switch (true) {
            //if we are talking about a text area element, then we know what we are doing
            case recordingEvent.recordingEventHTMLElement == 'HTMLTextAreaElement':
                //first we have to focus on the element and then we have to type the value
                return `await driver.findElement(By.css('${selector}')).sendKeys('${value}', Key.RETURN);`;
            //if we are dealing with an input element, things are a bit more complex
            case recordingEvent.recordingEventHTMLElement == 'HTMLInputElement':
                //then we need to have a detailed method of dealing with the various types of input
                switch (inputType) {
                    //then we need to handle every single input type, starting with those we can handle with a single click
                    case 'checkbox' || 'radio' || 'button' || 'submit' || 'reset':
                        //a simple click will work for the radio buttons and checkboxes
                        return `const target${index} = await driver.findElement(by.css('${selector}')); await driver.actions().click(target${index}).perform();`;
                    //certain types of text input can all be handled in the same way
                    case 'text' || 'password' || 'url' || 'email' || 'number' || 'search' || 'tel':
                        //first we have to focus on the element and then we have to type the value
                        return `await driver.findElement(By.css('${selector}')).sendKeys('${value}', Key.RETURN);`;
                    //then there are special HTML5 inputs that we need to shortcut
                    default:
                        //The <input type="color"> is used for input fields that should contain a color
                        //The <input type="time"> allows the user to select a time (no time zone).
                        //The <input type="date"> is used for input fields that should contain a date.
                        //The <input type="week"> allows the user to select a week and year.
                        //The <input type="month"> allows the user to select a month and year.
                        //The <input type="range"> defines a control for entering a number whose exact value is not important (like a slider control).
                        //FOR ALL THE ABOVE WE SHORTCUT
                        return `await driver.executeScript("document.querySelector('${selector}').value = ${value};");`;
                }
            //if we are dealing with an select element, puppeteer offers us a nice handler
            case recordingEvent.recordingEventHTMLElement == 'HTMLSelectElement':
                return `await driver.findElement(By.css('${selector}')).sendKeys('${value}');`;
            //if we are dealing with a standard HTMLElement with the contenteditable property, then we need to to something slightly different
            case recordingEvent.recordingEventInputType == 'contentEditable':
                //with the content editable, we can't just type in as we have a final text result on blur, so we need to adjust the text directly
                return `await driver.executeScript("document.querySelector('${selector}').textContent = '${value}';");`;
            //then we have a default for when we have no clue
            default:
                return `await driver.executeScript("document.querySelector('${selector}').value = '${value}';");`;
        }
    };

    nonInputTyping = (selector, replayEvent, index) => {
        //first we need a shorthand of our event
        const dispatchEvent = replayEvent.recordingEventDispatchKeyEvent;
        //then we need each of the modifier keys
        const ctrlKey = dispatchEvent.modifiers == 2 ? 'true' : 'false';
        const shiftKey = dispatchEvent.modifiers == 8 ? 'true' : 'false';
        const altKey = dispatchEvent.modifiers == 1 ? 'true' : 'false';
        const metaKey = dispatchEvent.modifiers == 4 ? 'true' : 'false';
        //then we need to know if the target was the main document or not
        //then we want to know if the action happened on the main html document or not
        let prependForTarget = '';
        //if the target was not the html, we need to focus on the right element using the selector
        if (replayEvent.recordingEventHTMLTag != 'HTML') {
            prependForTarget = `document.querySelector('${selector}').focus({ preventScroll: false });`;
        }
        //then we just need to create the whole string - we use standard keyboard events here - there may be a better solution
        const simulateKey = `${prependForTarget} const event${index} = new KeyboardEvent('keypress', { key: '${dispatchEvent.key}', code: '${dispatchEvent.code}', location: ${dispatchEvent.location}, repeat: ${dispatchEvent.autoRepeat}, ctrlKey: ${ctrlKey}, shiftKey: ${shiftKey}, altKey: ${altKey}, metaKey: ${metaKey}}); document.dispatchEvent( event${index} );`;
        //and return the string wrapped in the function
        return `await driver.executeScript("${simulateKey}");`;
    };

    scrollTo = (xPosition, yPosition) =>
        `await driver.executeScript("document.documentElement.scrollTo({ left: ${xPosition}, top: ${yPosition}, behavior: 'smooth' });");`;

    elementScrollTo = (selector, xPosition, yPosition) =>
        `await driver.executeScript("document.querySelector('${selector}').scrollTo({ left: ${xPosition}, top: ${yPosition}, behavior: 'smooth' });");`;

    focus = (selector) =>
        `await driver.executeScript("document.querySelector('${selector}').focus({ preventScroll: false });");`;

    hover = (selector, index) =>
        `const hoverTarget${index} = await driver.findElement(by.css('${selector}'));  ${this.tabIndex(
            index
        )}await driver.actions().move(hoverTarget${index}).perform();`;

    textSelect = (selector, index) =>
        `await driver.executeScript("const range${index} = document.createRange(); const referenceNode${index} = document.querySelector('${selector}'); range${index}.selectNode(referenceNode${index}); const currentSelection${index} = window.getSelection(); currentSelection${index}.removeAllRanges(); currentSelection${index}.addRange(range${index});");`;

    //ASSERTIONS HELPERS, we need to have the index of each item in the Rx.js flow so we can have unique assertions

    getPageUrl = () => 'await driver.getCurrentUrl();';

    getPageTitle = () => `await driver.getTitle();`;

    getElementText = (selector) => `await driver.findElement(by.css('${selector}')).getText();`;

    getVisibleElement = (selector) => `await driver.findElement(by.css('${selector}')).isDisplayed();`;

    querySelector = (selector) => `await driver.findElement(by.css('${selector}'));`;

    querySelectorAll = (selector) => `await driver.findElements(by.css('${selector}'));`;

    countElements = (selector) =>
        `await new Promise(resolve => driver.findElements(by.css('${selector}')).then(elements => resolve(elements.length)));`;

    getElementAttribute = (selector, attribute) =>
        `await new Promise(resolve => driver.findElement(by.css('${selector}')).then(element => resolve(element['${attribute}'])));`;

    getElementAttributeValue = (selector, attribute) =>
        `await new Promise(resolve => driver.findElement(by.css('${selector}')).then(element => resolve(element.getAttribute('${attribute}'))));`;

    getElementAttributesAsArray = (selector) =>
        `await new Promise(resolve => driver.findElement(by.css('${selector}')).then(element => Array.prototype.slice.call(element.attributes)));`;

    //COMMAND GENERATION FUNCTIONS

    getMostValidSelector = (replayEvent) => {
        //if we have run the replay, we will get a report on the selector that was chosen
        if (replayEvent.replayChosenSelectorString && replayEvent.replayChosenSelectorString.length > 0) {
            return replayEvent.replayChosenSelectorString;
        }
        //if we have run the assertion, we will get a report on the selector that was chosen
        if (replayEvent.assertionChosenSelectorString && replayEvent.assertionChosenSelectorString.length > 0) {
            return replayEvent.assertionChosenSelectorString;
        }
        //otherwise collect all the existing selectors into an array, filter and return the first valid one
        return (
            [
                replayEvent.recordingEventCssSelectorPath,
                replayEvent.recordingEventCssFinderPath,
                replayEvent.recordingEventCssDomPath,
            ]
                //when we filter we need to know what the selectors return when they fail
                .filter(Boolean)[0] || ''
        );
    };

    mapActionTypeToFunction = (replayEvent, index) => {
        //set up the empty string
        let outputString = '';

        //then we need to determine the type of recording event action so we can deliver the right piece of code to the text area
        switch (replayEvent.recordingEventAction) {
            //mouse actions can have many variants so we need a subswitch
            case 'Mouse':
                //here we switch on type of action
                switch (replayEvent.recordingEventActionType) {
                    case 'hover':
                        //in the case of hover, we get the most valid selector and then push the string result of the hover selctor into the array
                        outputString += this.hover(this.getMostValidSelector(replayEvent), target);
                        break;
                    case 'recaptcha':
                        //recaptcha is different in recording terms as the event we listen to is not the event we replay - click to replay
                        outputString += this.recaptcha(this.getMostValidSelector(replayEvent), target);
                        break;
                    default:
                        //then we have the default, which handles all the standard clicks, including 'click', 'dblclick' and 'contextmenu'
                        outputString += this.mouseClick(
                            this.getMostValidSelector(replayEvent),
                            replayEvent.recordingEventActionType,
                            index,
                            target
                        );
                }
                break;
            //scroll has no particular solution in Puppeteer
            case 'Scroll':
                outputString += this.scrollTo(
                    replayEvent.recordingEventXPosition,
                    replayEvent.recordingEventYPosition,
                    index,
                    target
                );
                break;
            case 'ElementScroll':
                outputString += this.elementScrollTo(
                    this.getMostValidSelector(replayEvent),
                    replayEvent.recordingEventXPosition,
                    replayEvent.recordingEventYPosition,
                    index,
                    target
                );
                break;
            //neither does text select
            case 'TextSelect':
                outputString += this.textSelect(this.getMostValidSelector(replayEvent), index, target);
                break;
            case 'Keyboard':
                outputString += this.nonInputTyping(this.getMostValidSelector(replayEvent), replayEvent, index);
                break;
            case 'Input':
                outputStringArray.push(this.inputParser(this.getMostValidSelector(replayEvent), recordingEvent, index));
                break;
            case 'Page':
                //here we just do a simple return with the standard tabbing
                return `${this.tabIndex(0)}// Page navigated to ${replayEvent.recordingEventLocationHref}`;
            default:
                console.log(`No Mapping for Action Type ${replayEvent.recordingEventAction}`);
                //here we do a simple return with the indented tabbing so it falls in the same place as the action
                return `${this.tabIndex(index)}//No Mapping Type in Puppeteer for Action ${
                    replayEvent.recordingEventAction
                }`;
        }

        //then we need to wrap any iframe commands, which returns an array
        let outputArray = this.wrapIframeCommand(replayEvent, index, outputString);
        //then if we reach this point we need to map the string array, with a tabbing element for formatting
        outputArray = outputArray.map((string) => `${this.tabIndex(index)}${string}`);
        //then we need to return the string
        return outputArray.join('');
    };

    wrapIframeCommand = (replayEvent, index, commandString) => {
        //we need an array that we can concat
        let outputArray = [];
        //then we need to find out if the event has taken place in an iframe
        if (replayEvent.recordingEventIsIframe) {
            //first we need to get the details of the iframe we are going to be looking for
            const replayFrameUrl = new URL(replayEvent.recordingEventLocationHref);
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
    };
}

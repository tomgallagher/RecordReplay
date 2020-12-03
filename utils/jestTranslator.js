class JestTranslator {
    //pass in an options object which can take new languages
    constructor(options) {
        // set default values for the keycodes class
        const defaults = {
            //internal defaults
            replayTestUrl: '',
            replayTestID: 0,
        };
        // create a new object with the defaults over-ridden by the options passed in
        let opts = Object.assign({}, defaults, options);
        // assign options to instance data (using only property names contained in defaults object to avoid copying properties we don't want)
        Object.keys(defaults).forEach((prop) => {
            this[prop] = opts[prop];
        });
        //assign the translator to the options object, which we can check using instanceOf
        switch (true) {
            case options.translator === 'Puppeteer':
                this.chosenTranslator = new PuppeteerTranslator({});
                break;
            case options.translator === 'TestingLibrary':
                this.chosenTranslator = new TestingLibraryTranslator({});
                break;
            case options.translator === 'Selenium':
                this.chosenTranslator = new SeleniumTranslator({});
                break;
            default:
                this.chosenTranslator = null;
        }
    }

    //FORMATTING FUNCTIONS

    //set up global browser variable
    defineBrowser = () => 'let browser';

    //this is where we need to do all set up operations
    beforeAllAsyncOpenFunction = () => 'beforeAll(async () => {';

    //after set up complete then close the function
    beforeAllAsyncCloseFunction = () => '});';

    //this is where we need to do all clean up operations
    afterAllAsyncOpenFunction = () => 'afterAll(async () => {';

    //after clean up complete then close the function
    afterAllAsyncCloseFunction = () => '});';

    openJestTest = (replay) => `describe('${replay.recordingTestName}', function () {\n`;

    closeJestTest = () => `\n});`;

    openJestReplay = (replay) => `\n\tit('${replay.replayName}', async () => {\n`;

    closeJestReplay = () => `\n\t});`;

    openTimedFunction = () => `\n\t\tawait new Promise(resolve => window.setTimeout(() => {`;

    closeTimedFunction = (delay) => `\t\t\tresolve(); \n\t\t}, ${delay}));\n`;

    tabbingStripper = (string) => string.replace(/[\r\n]+/gm, '');

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

    //ALL ACTIONS ARE CALLED BY REFERENCE TO THE CHOSEN TRANSLATOR SO WE NEED TO HAVE EXACT MATCHES FOR ALL FUNCTIONALITY

    //ASSERTION FUNCTIONS
    navigationAssertion = (replayEvent, index) =>
        `const navigation${index} = ${this.chosenTranslator.getPageUrl()} ${this.tabIndex(
            index
        )}expect(navigation${index}).toMatch('${replayEvent.recordingEventLocationHref}');`;

    visibleAssertion = (selector, index, target) =>
        `const visibleAssertion${index} = ${this.chosenTranslator.getVisibleElement(selector, target)} ${this.tabIndex(
            index
        )}expect(visibleAssertion${index}).toBeTruthy();`;

    textAssertion = (selector, assertionEvent, index, target) =>
        `const textAssertion${index} = ${this.chosenTranslator.getElementText(selector, target)} ${this.tabIndex(
            index
        )}expect(textAssertion${index}).toMatch('${assertionEvent.assertionValue}');`;

    hasAttributeAssertion = (selector, assertionEvent, index, target) =>
        `const hasAttribute${index} = ${this.chosenTranslator.getElementAttribute(
            selector,
            assertionEvent.assertionAttribute,
            target
        )} ${this.tabIndex(index)}expect(hasAttribute${index}).toBeTruthy();`;

    hasAttributeValueAssertion = (selector, assertionEvent, index, target) =>
        `const hasAttributeValue${index} = ${this.chosenTranslator.getElementAttributeValue(
            selector,
            assertionEvent.assertionAttribute,
            target
        )} ${this.tabIndex(index)}expect(hasAttributeValue${index}).toMatch('${assertionEvent.assertionValue}');`;

    //COMMAND GENERATION FUNCTIONS

    mapActionTypeToFunction = (replayEvent, index) => {
        //first we need to create the variable for our target, passed to all translators as last param but only used by puppeteer
        let target = 'page';
        //then we need to create an array that we can push our strings into then join them at the end
        let outputStringArray = [];
        //then we need to accommodate replay events and assertion events
        const action = replayEvent.assertionEventAction || replayEvent.recordingEventAction;

        //then we need to deal with the different ways of handling iframes
        if (replayEvent.recordingEventIsIframe) {
            //with Puppeteer we need to change the reference target so we add lines up front
            if (this.chosenTranslator instanceof PuppeteerTranslator) {
                //first we need to get the details of the iframe we are going to be looking for
                const recordingFrameUrl = new URL(replayEvent.recordingEventLocationHref);
                //then we need to get the origin and the path
                const recordingFrameOrigin = recordingFrameUrl.origin;
                const recordingFramePath = recordingFrameUrl.pathname;
                //then we need to find the frame using the origin and path and allocate it to our indexed frame
                var getFrameString = `const frame${index} = page.frames().find(frame => frame.url().includes('${recordingFrameOrigin}') && frame.url().includes('${recordingFramePath}'));`;
                //then push the frame string to the array
                outputStringArray.push(getFrameString);
                //then we set the target to be the indexed frame
                target = `frame${index}`;
            }
        }

        //then we need to determine the type of recording event action so we can deliver the right piece of code to the text area
        switch (action) {
            //mouse actions can have many variants so we need a subswitch
            case 'Mouse':
                //here we switch on type of action
                switch (replayEvent.recordingEventActionType) {
                    case 'hover':
                        //in the case of hover, we get the most valid selector and then push the string result of the hover selctor into the array
                        outputStringArray.push(
                            this.chosenTranslator.hover(
                                this.chosenTranslator.getMostValidSelector(replayEvent),
                                index,
                                target
                            )
                        );
                        break;
                    case 'recaptcha':
                        //recaptcha is different in recording terms as the event we listen to is not the event we replay - click to replay
                        outputStringArray.push(
                            this.chosenTranslator.recaptcha(
                                this.chosenTranslator.getMostValidSelector(replayEvent),
                                index,
                                target
                            )
                        );
                        break;
                    default:
                        //then we have the default, which handles all the standard clicks, including 'click', 'dblclick' and 'contextmenu'
                        outputStringArray.push(
                            this.chosenTranslator.mouseClick(
                                this.chosenTranslator.getMostValidSelector(replayEvent),
                                replayEvent.recordingEventActionType,
                                index,
                                target
                            )
                        );
                }
                break;
            case 'Scroll':
                outputStringArray.push(
                    this.chosenTranslator.scrollTo(
                        replayEvent.recordingEventXPosition,
                        replayEvent.recordingEventYPosition,
                        index,
                        target
                    )
                );
                break;
            case 'ElementScroll':
                outputStringArray.push(
                    this.chosenTranslator.elementScrollTo(
                        this.chosenTranslator.getMostValidSelector(replayEvent),
                        replayEvent.recordingEventXPosition,
                        replayEvent.recordingEventYPosition,
                        index,
                        target
                    )
                );
                break;
            case 'TextSelect':
                outputStringArray.push(
                    this.chosenTranslator.textSelect(
                        this.chosenTranslator.getMostValidSelector(replayEvent),
                        index,
                        target
                    )
                );
                break;
            case 'Keyboard':
                outputStringArray.push(
                    this.chosenTranslator.nonInputTyping(
                        this.chosenTranslator.getMostValidSelector(replayEvent),
                        replayEvent,
                        index,
                        target
                    )
                );
                break;
            case 'Input':
                outputStringArray.push(
                    this.chosenTranslator.inputParser(
                        this.chosenTranslator.getMostValidSelector(replayEvent),
                        replayEvent,
                        index,
                        target
                    )
                );
                break;
            case 'Page':
                if (!this.chosenTranslator instanceof TestingLibraryTranslator) {
                    outputStringArray.push(this.navigationAssertion(replayEvent, index));
                }
                break;
            case 'Assertion':
                //here we switch on type of assertion, this is determined by the clicks on the checkboxes
                //checkboxes are created by nodebuilder and then added by listening to clicks on checboxes in newReplay.js
                switch (replayEvent.assertionType) {
                    case 'Visible':
                        outputStringArray.push(
                            this.visibleAssertion(
                                this.chosenTranslator.getMostValidSelector(replayEvent),
                                index,
                                target
                            )
                        );
                        break;
                    case 'Text Content':
                        outputStringArray.push(
                            this.textAssertion(
                                this.chosenTranslator.getMostValidSelector(replayEvent),
                                replayEvent,
                                index,
                                target
                            )
                        );
                        break;
                    case 'Present':
                        outputStringArray.push(
                            this.hasAttributeAssertion(
                                this.chosenTranslator.getMostValidSelector(replayEvent),
                                replayEvent,
                                index,
                                target
                            )
                        );
                        break;
                    case 'Content':
                        outputStringArray.push(
                            this.hasAttributeValueAssertion(
                                this.chosenTranslator.getMostValidSelector(replayEvent),
                                replayEvent,
                                index,
                                target
                            )
                        );
                        break;
                    default:
                        return `${this.tabIndex(index)}//No Mapping Type in Puppeteer for Action ${
                            replayEvent.assertionType
                        }`;
                }
                break;
            default:
                console.log(`No Mapping for Action Type ${replayEvent.recordingEventAction}`);
                //here we do a simple return with the indented tabbing so it falls in the same place as the action
                return `${this.tabIndex(index)}//No Mapping Type in Puppeteer for Action ${
                    replayEvent.recordingEventAction
                }`;
        }

        //then we need to deal with the different ways of handling iframes
        if (replayEvent.recordingEventIsIframe) {
            //with Selenium we need to wrap the command at the first position in the output array
            if (this.chosenTranslator instanceof SeleniumTranslator) {
                //the wrap iframe command returns an array
                outputStringArray = this.chosenTranslator.wrapIframeCommand(replayEvent, index, outputStringArray[0]);
            }
        }
        //then if we reach this point we need to mao the string array, with a tabbing element for formatting
        outputStringArray = outputStringArray.map((string) => `${this.tabIndex(index)}${string}`);
        //then we need to return the string
        return outputStringArray.join('');
    };

    buildReplayStringFromEvents = (replay) => {
        return new Promise((resolve) => {
            //start with an empty string
            var outputString = '';
            //if testing library, warn and import the specific packages
            if (this.chosenTranslator instanceof TestingLibraryTranslator) {
                //add the standard package comment
                outputString = outputString += this.chosenTranslator.standardPackageComment;
                //add the packages
                outputString = outputString += this.chosenTranslator.packages;
            }
            //add the standard Jest opening function
            outputString += this.openJestTest(replay);
            //then add the standard opening comment, if not testing library
            outputString += this.chosenTranslator.standardOpeningComment;
            //add the standard Jest test function
            outputString += this.openJestReplay(replay);
            //then we need to add some special stuff for puppeteer
            if (this.chosenTranslator instanceof PuppeteerTranslator) {
                //if we are in puppeteer then we need to open the page
                outputString += `${this.tabIndex(0)}${this.chosenTranslator.openPage()}`;
                //then we need to create the cdp session
                outputString += `${this.tabIndex(0)}${this.chosenTranslator.connectToChromeDevtools()}`;
                //then we need to do the network emulation
                outputString += `${this.tabIndex(0)}${this.chosenTranslator.emulateNetworkConditions(
                    false,
                    replay.recordingTestBandwidthValue,
                    replay.recordingTestBandwidthValue,
                    replay.recordingTestLatencyValue
                )}`;
                //then the mobile emulation, if required
                if (replay.recordingIsMobile) {
                    outputString += `${this.tabIndex(0)}${this.chosenTranslator.emulateDevice(replay)}`;
                }
            }
            //add the open page function - we don't need this with Testing Library
            if (!this.chosenTranslator instanceof TestingLibraryTranslator) {
                outputString += `${this.tabIndex(0)}${this.chosenTranslator.navigateToUrl(
                    replay.recordingTestStartUrl
                )}`;
            }
            //then we determine if we are working with a replay that has been run or not, we start with the replay event array by default
            var eventsArray = replay.replayEventArray;
            //then if we have a good replay
            if (replay.replayStatus) {
                eventsArray = replay.mutatedReplayEventArray;
            }
            //then we loop through the array
            for (let event in eventsArray) {
                //open the async timeout function
                outputString += this.openTimedFunction();
                //then add the string using the action mapped to function
                outputString += `${this.mapActionTypeToFunction(eventsArray[event], event)}\n`;
                //close the async timeout function
                outputString += this.closeTimedFunction(eventsArray[event].recordingTimeSincePrevious);
            }
            //if we are in puppeteer then we need to close the page
            if (this.chosenTranslator instanceof PuppeteerTranslator)
                outputString += `${this.tabIndex(0)}${this.chosenTranslator.closePage()}`;
            //add the close test function
            outputString += this.closeJestReplay();
            //add the standard close Jest function
            outputString += this.closeJestTest();
            //return the string
            resolve(outputString);
        });
    };
}

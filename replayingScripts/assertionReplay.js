
class AssertionReplay {

    constructor(replayEvent) {
        
        //so there are generic properties that need to be imported into all specific replay classes from the replay event
        //we need to have the replay id so the content scripts and user interface can be sure they are communicating about the same event
        this.replayId = replayEvent.replayEventId;
        //the replay event action is required for reporting to the console
        this.action = replayEvent.recordingEventAction;
        //the action type is saved as different action types can require different handling in the action and playback functions
        this.actionType = replayEvent.recordingEventActionType;
        //the HTML element constructor name is used to double check the good operation of the css selectors
        this.targetHTMLName = replayEvent.recordingEventHTMLElement;
        //same with the tag name, just a method of ensuring that the selector has not identified the wrong element
        this.targetTagName = replayEvent.recordingEventHTMLTag;
        //we need to save all three selector paths, it's possible that a class-based selector can fail while the others succeeed
        this.cssSelectorPath = replayEvent.recordingEventCssSelectorPath;
        this.domPath = replayEvent.recordingEventCssDomPath;
        this.simmerPath = replayEvent.recordingEventCssSimmerPath;
        //then we need to save xpath
        this.xpath = replayEvent.recordingEventXPath;
        //then we need to keep the messaging send response function attached to the class as the testing process relies on sending responses back to user interface
        this.sendResponse = replayEvent.sendResponse || null;

        //then special properties for assertion checking
        //we need to have the kind of assertion, is it "Text Content", "Present" or "Content"
        this.assertionType = replayEvent.assertionType;
        //we need to have the attribute we are looking to assert on
        this.assertionAttribute = replayEvent.assertionAttribute;
        //we need to have the attribute value we may be looking to assert on
        this.assertionValue = replayEvent.assertionValue;
        //then we may need to know the type of element we are looking to assert on, in case of nested assertions, this allows further searching in target element
        this.assertionElement = replayEvent.assertionElement;
        //then we may need to know the nested level, in case we want to display an existing assertion in the user interface and check the checkbox
        this.assertionNestedLevel = replayEvent.assertionNestedLevel;

        //then there are generic state properties that we need for reporting back to the user interface
        //log messages are displayed to the user in the case of success or failure
        this.replayLogMessages = [];
        //error messages are only displayed on failure
        this.replayErrorMessages = [];
        //always important to assess whether the record/replay is operating in the context of an iframe
        this.isIframe = EventReplayer.contextIsIframe();
        //once the selectors have been tested and assessed, one selector report is chosen
        this.chosenSelectorReport = null;
        //we need to know when the event was replayed as the user interface shows timings
        this.replayEventReplayed = 0;

        //KEY MARKER - SUCCESS OR FAILURE OF REPLAY
        this.replayEventStatus = null;

        //first we check in each class that we have a matching url
        this.matchingUrlReport = new MatchingUrlReport(replayEvent);

        //if the matching url report returns false then we add the property that ensures it will be filtered
        if (this.matchingUrlReport == false) {
            //set the property
            this.replayEventStatus = false;
            //then just return this early as we have no need to so any further work
            //we also offer no report via return message from non-matching locations
            return this;
        }

        //then each replay class must have a collected set of Replay Selector Reports
        this.replaySelectorReports = [
            new ReplaySelectorReport({ key: "CssSelector", selectorString: this.cssSelectorPath, targetHtmlName: this.targetHTMLName, targetHtmlTag: this.targetTagName }),
            new ReplaySelectorReport({ key: "DomPathSelector", selectorString: this.domPath, targetHtmlName: this.targetHTMLName, targetHtmlTag: this.targetTagName }),
            new ReplaySelectorReport({ key: "SimmerSelector", selectorString: this.simmerPath, targetHtmlName: this.targetHTMLName, targetHtmlTag: this.targetTagName }),
            //here we need to send slightly different input into the class, which must then generate its own CSS selector string
            new ReplayXpathReport({ key: "XPathSelector", xpathString: this.xpath, targetHtmlName: this.targetHTMLName, targetHtmlTag: this.targetTagName })
        ];
        
        //see if we have any invalid selector reports
        this.failedReplaySelectorReports = this.replaySelectorReports.filter(report => report.invalidSelector);
        //if we have invalid selectors then we need to know
        if (this.failedReplaySelectorReports.length > 0) this.replayErrorMessages.push(this.failedReplaySelectorReports.map(report => report.warningMessages).join(', '));
        //see if we have any valid selector reports, and if we do, we save as the definitive selector reports 
        this.replaySelectorReports = this.replaySelectorReports.filter(report => !report.invalidSelector);
        //if we have valid selectors then we need to know about which ones remain valid
        if (this.replaySelectorReports.length > 0) this.replayLogMessages.push(this.replaySelectorReports.map(report => report.logMessages).join(', '));

        //then we need to have an outcome
        if (this.replaySelectorReports.length > 0) {
            //select the first report that has provided a positive response
            this.chosenSelectorReport = this.replaySelectorReports[0];
        } else {
            //then we need to push an error message to the logs
            this.replayErrorMessages.push(`No Valid Target On Page`);
            //otherwise we report the time of the fail
            this.replayEventReplayed = Date.now();
            //and we set the status to false to indicate a failed replay
            this.replayEventStatus = false;
            //then send the response if we have the facility
            if (this.sendResponse != null) {
                //first we make a clone of this 
                var replayExecution = Object.assign({}, this);
                //then we delete the sendResponse function from the clone, just to avoid any confusion as it passes through messaging system
                delete replayExecution.sendResponse;
                //then we send the clean clone
                this.sendResponse({replayExecution: replayExecution});
            }            

        }

    }

    //all of the replayers must have an action function that will instantiate the replay - make it happen on the page
    actionFunction = () => {
        //here we need a very slight delay to ensure that our listener is in place before the action function executes
        return new Promise(resolve => {
            //we use setTimeout and resolve to introduce the delay
            setTimeout( () => {

                //create the assertion result we are going to be looking to report
                let assertionResult = false;
                //then what we do depends whether it is being performed on the root element
                if (this.assertionElement == "ROOT" && this.assertionNestedLevel == 0) {
                    //OPERATING ON ROOT ELEMENT - what we do depends on the kind of assertion we are performing
                    switch(this.assertionType) {
                        case "Text Content":
                            //see if the textcontent of the element matches the value we are expecting
                            assertionResult = document.querySelector(this.chosenSelectorReport.selectorString).textContent == this.assertionValue;
                            if (assertionResult) {
                                this.replayLogMessages.push(`Asserted Text Content: ${this.assertionValue}`);
                            } else {
                                this.replayErrorMessages.push(`Failed to Assert Text Content: ${this.assertionValue}`);
                            }
                            break;
                        case "Present":
                            assertionResult = document.querySelector(this.chosenSelectorReport.selectorString).hasAttribute(this.assertionAttribute);
                            if (assertionResult) {
                                this.replayLogMessages.push(`Asserted Attribute: ${this.assertionAttribute}`);
                            } else {
                                this.replayErrorMessages.push(`Failed to Assert Attribute: ${this.assertionAttribute}`);
                            }
                            break;
                        case "Content":
                            assertionResult = document.querySelector(this.chosenSelectorReport.selectorString).getAttribute(this.assertionAttribute) == this.assertionValue;
                            if (assertionResult) {
                                this.replayLogMessages.push(`Asserted Attribute: ${this.assertionAttribute}, Asserted Value: ${this.assertionValue}`)
                            } else {
                                this.replayErrorMessages.push(`Failed to Assert Attribute: ${this.assertionAttribute}, Value: ${this.assertionValue}`)
                            }
                            break;
                        default:
                            console.error(`Unrecognised Assertion Type: ${this.assertionType}`);
                    }
                } else {
                    //OPERATING ON NESTED ELEMENT - what we do depends on the kind of assertion we are performing
                    //first we need to get the target parent element
                    const targetElement = document.querySelector(this.chosenSelectorReport.selectorString);
                    //then we need to get all the elements in the target element that match the assertion element
                    const relevantChildren = targetElement.querySelectorAll(this.assertionElement);
                    //then we need to report if there are no relevant children
                    relevantChildren.length == 0 ? this.replayErrorMessages.push(`No Nested ${this.assertionElement} Elements Found`) : null;
                    //then we need to create an array from the nodelist so we can assert on all children which match nested element type
                    const relevantChildrenArray = Array.prototype.slice.call(relevantChildren);
                    //OPERATING ON CHILDREN - what we do depends on the kind of assertion we are performing
                    switch(this.assertionType) {
                        case "Text Content":
                            //see if any children have matching text content
                            assertionResult = relevantChildrenArray.some(element => element.textContent == this.assertionValue);
                            if (assertionResult) {
                                this.replayLogMessages.push(`Found Nested ${this.assertionElement} Element: Asserted Text Content: ${this.assertionValue}`);
                            } else {
                                this.replayErrorMessages.push(`Failed to Assert Text Content: ${this.assertionValue} On Nested ${this.assertionElement} Element`);
                            }
                            break;
                        case "Present":
                            //see if any children have matching attribute
                            assertionResult = relevantChildrenArray.some(element => element.hasAttribute(this.assertionAttribute));
                            if (assertionResult) {
                                this.replayLogMessages.push(`Found Nested ${this.assertionElement} Element: Asserted Attribute: ${this.assertionAttribute}`);
                            } else {
                                this.replayErrorMessages.push(`Failed to Assert Attribute: ${this.assertionAttribute} On Nested ${this.assertionElement} Element`);
                            }
                            break;
                        case "Content":
                            //see if any children have matching attribute and value
                            assertionResult = relevantChildrenArray.some(element => element.getAttribute(this.assertionAttribute) == this.assertionValue);
                            if (assertionResult) {
                                this.replayLogMessages.push(`Found Nested ${this.assertionElement} Element: Asserted Attribute: ${this.assertionAttribute}, Asserted Value: ${this.assertionValue}`);
                            } else {
                                this.replayErrorMessages.push(`Failed to Assert Attribute: ${this.assertionAttribute}, Value: ${this.assertionValue} On Nested ${this.assertionElement} Element`);
                            }
                            break;
                        default:
                            console.error(`Unrecognised Assertion Type: ${this.assertionType}`);
                    }
                }
                //then report accordingly
                assertionResult ? this.replayLogMessages.push(`${this.assertionType} Assertion Passed`) : this.replayErrorMessages.push(`${this.assertionType} Assertion Failed`);
                //there are no actions that take place with assertions but we create an artificial mouseenter event so we can process similarly
                const artificialEvent = new MouseEvent("mouseenter", {view: window, bubbles: true, cancelable: false});
                //then we dispatch the event to our element
                document.querySelector(this.chosenSelectorReport.selectorString).dispatchEvent( artificialEvent );
                //then return the assertion result
                resolve(assertionResult);

            }, 5);
        });

    }

    returnPlayBackObservable = () => Rx.Observable.fromEvent(document.querySelector(this.chosenSelectorReport.selectorString), "mouseenter")

}

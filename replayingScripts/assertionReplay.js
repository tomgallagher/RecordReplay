class AssertionReplay {

    constructor(replayEvent) {
        
        //so there are generic properties that need to be imported into all specific replay classes from the ASSERTION event
        //we need to have the replay id so the content scripts and user interface can be sure they are communicating about the same event
        this.replayId = replayEvent.assertionId;
        //the replay event action is required for reporting to the console
        this.action = replayEvent.assertionEventAction;
        //the action type is saved as different action types can require different handling in the action and playback functions
        this.actionType = replayEvent.recordingEventActionType;
        //the HTML element constructor name is used to double check the good operation of the css selectors
        this.targetHTMLName = replayEvent.recordingEventHTMLElement;
        //same with the tag name, just a method of ensuring that the selector has not identified the wrong element
        this.targetTagName = replayEvent.recordingEventHTMLTag;
        //we need to save all three selector paths, it's possible that a class-based selector can fail while the others succeeed
        this.cssSelectorPath = replayEvent.recordingEventCssSelectorPath;
        this.domPath = replayEvent.recordingEventCssDomPath;
        this.finderPath = replayEvent.recordingEventCssFinderPath;
        //then we need to save xpath
        this.xpath = replayEvent.recordingEventXPath;
        //then we need to keep the messaging send response function attached to the class as the testing process relies on sending responses back to user interface
        this.sendResponse = replayEvent.sendResponse || null;
        
        //then we need to have a special marker for internal testing
        this.assertionShouldFail = replayEvent.assertionShouldFail

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

        //then we only need to do any further work if we have a matching url report
        //if the url report is not matching, everything else is a waste of time
        //we especially don't need any messages sent back from unmatched urls, reporting that we can't find a selector
        if (this.matchingUrlReport.matched) {

            //then each replay class must have a collected set of Replay Selector Reports
            this.replaySelectorReports = [
                new ReplaySelectorReport({ key: "CssSelector", selectorString: this.cssSelectorPath, targetHtmlName: this.targetHTMLName, targetHtmlTag: this.targetTagName }),
                new ReplaySelectorReport({ key: "OptimalSelector", selectorString: this.domPath, targetHtmlName: this.targetHTMLName, targetHtmlTag: this.targetTagName }),
                new ReplaySelectorReport({ key: "RecordReplaySelector", selectorString: this.finderPath, targetHtmlName: this.targetHTMLName, targetHtmlTag: this.targetTagName }),
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
                //select the first report that has provided a positive response and has the shortest selector
                this.chosenSelectorReport = this.replaySelectorReports.sort((reportA, reportB) => reportA.selectorString.length - reportB.selectorString.length)[0];
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

        //if we have a non-matching url report, just set the event status to false so no further processing is done
        } else { this.replayEventStatus = false; }

    }

    //all of the replayers must have an action function that will instantiate the replay - make it happen on the page
    actionFunction = () => {
        //here we need a very slight delay to ensure that our listener is in place before the action function executes
        return new Promise(resolve => {
            //we use setTimeout and resolve to introduce the delay
            setTimeout( () => {

                //create the assertion result we are going to be looking to report
                let assertionResult = false;
                //create the element variable we are going to be using
                let element;
                //then what we do depends whether it is being performed on the root element
                if (this.assertionElement == "ROOT" && this.assertionNestedLevel == 0) {
                    //OPERATING ON ROOT ELEMENT - what we do depends on the kind of assertion we are performing
                    switch(this.assertionType) {
                        case "Visible":
                            //find the selected element
                            element = document.querySelector(this.chosenSelectorReport.selectorString);
                            //then we have a deliberate fail for internal testing
                            if (element && this.assertionShouldFail) element.style.visibility = "hidden";
                            //if we have the element then we need to check the style for visibility and then display properties indirectly by getBoundingClientRect
                            if (element) {
                                //get the style of the selected element
                                const style = window.getComputedStyle(element);
                                //provide a function to check that display is not equal to none
                                function hasVisibleBoundingBox() { const rect = element.getBoundingClientRect(); return !!(rect.top || rect.bottom || rect.width || rect.height); }
                                //then set the assertion result to the outcome of this
                                assertionResult = style && style.visibility !== 'hidden' && hasVisibleBoundingBox();
                            }
                            //then we will have an assertion result if we have found the element and the element has the necessary visibility and display characteristics
                            assertionResult ? this.replayLogMessages.push(`Asserted Visible`) : this.replayErrorMessages.push(`Failed to Assert Visible`);
                            //and we're done
                            break;
                        case "Text Content":
                            //find the selected element
                            element = document.querySelector(this.chosenSelectorReport.selectorString);
                            //then we have a deliberate fail for internal testing
                            if (element && this.assertionShouldFail) element.textContent = "FAIL";
                            //then if we have the element we need to check the text content is OK
                            if (element) {
                                //see if the textcontent of the element matches the value we are expecting
                                assertionResult = element.textContent == this.assertionValue;
                            }
                            //logging success or failure
                            if (assertionResult) { this.replayLogMessages.push(`Asserted Text: ${this.assertionValue}`) }
                            else { this.replayErrorMessages.push(`Failed to Assert Text: ${this.assertionValue}`); }
                            //and we're done
                            break;
                        case "Present":
                            //find the selected element
                            element = document.querySelector(this.chosenSelectorReport.selectorString);
                            //then we have a deliberate fail for internal testing
                            if (element && this.assertionShouldFail) element.removeAttribute(this.assertionAttribute);
                            //then if we have the element we need to check the attribute is present
                            if (element) {
                                //see if the element has the attribute we are expecting
                                assertionResult = element.hasAttribute(this.assertionAttribute);
                            }
                            //logging success or failure
                            if (assertionResult) { this.replayLogMessages.push(`Asserted Attribute: ${this.assertionAttribute}`) }
                            else { this.replayErrorMessages.push(`Failed to Assert Attribute: ${this.assertionAttribute}`); }
                            //and we're done
                            break;
                        case "Content":
                            //find the selected element
                            element = document.querySelector(this.chosenSelectorReport.selectorString);
                            //then we have a deliberate fail for internal testing
                            if (element && this.assertionShouldFail) element.setAttribute(this.assertionAttribute, '');
                            //then if we have the element we need to check it has the attribute we are expecting and the value is what we're expecting
                            if (element) {
                                //set the assertion result to what we care about
                                assertionResult = element.getAttribute(this.assertionAttribute) == this.assertionValue;
                            }
                            //logging success or failure
                            if (assertionResult) { this.replayLogMessages.push(`Asserted Attribute: ${this.assertionAttribute}, Asserted Value: ${this.assertionValue}`); } 
                            else { this.replayErrorMessages.push(`Failed to Assert Attribute: ${this.assertionAttribute}, Value: ${this.assertionValue}`) }
                            //and we're done
                            break;
                        default:
                            EventReplayer.logWithContext(`Unrecognised Assertion Type: ${this.assertionType}`);
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
                        case "Visible":
                            //see if any children have are visible
                            assertionResult = relevantChildrenArray
                                //we need to have an isVisible property on each of the children
                                .map(element => {
                                    //get the style of the child element
                                    const style = window.getComputedStyle(element);
                                    //provide a function to check that display is not equal to none
                                    function hasVisibleBoundingBox() { const rect = element.getBoundingClientRect(); return !!(rect.top || rect.bottom || rect.width || rect.height); }
                                    //then set the isVisible result to the outcome of the style and display properties
                                    element.isVisible = style && style.visibility !== 'hidden' && hasVisibleBoundingBox();
                                    //then return the element
                                    return element;
                                })
                                //return boolean if any of the nested elements are visible
                                .some(element => element.isVisible);
                            if (assertionResult) {
                                this.replayLogMessages.push(`Found Nested Visible ${this.assertionElement} Element`);
                            } else {
                                this.replayErrorMessages.push(`Failed to Visible On Nested ${this.assertionElement} Element`);
                            }
                            break;
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
                            EventReplayer.logWithContext(`Unrecognised Assertion Type: ${this.assertionType}`);
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

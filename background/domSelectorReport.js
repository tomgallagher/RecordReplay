class DomSelectorReport {

    constructor(options) {

        //the use of the anonymous async function in constructor enables us to set up the tab runner with any callback functions and receive responses
        //see https://stackoverflow.com/questions/43431550/async-await-class-constructor

        return (async () => {

            //we need to create a uniform class with the given selector, using inputs that we get from the EventRecorder
            //we need to have the key so we can report
            this.selectorKey = options.key;
            //we need to have the browser tab id for the commands
            this.browserTabId = options.browserTabId;
            //we need to have the target tag
            this.targetHtmlElement = options.replayEvent.recordingEventHTMLElement;
            //then we need to get the correct selector
            switch(this.selectorKey) {
                case "CssSelector":
                    this.selectorString = options.replayEvent.recordingEventCssSelectorPath;
                    break;
                case "DomPathSelector":
                    this.selectorString = options.replayEvent.recordingEventCssDomPath;
                    break;
                case "FinderSelector":
                    this.selectorString = options.replayEvent.recordingEventCssFinderPath;
                    break;
            }
            //then we need to know if we are operating in an iframe or not 
            this.isIframe = options.replayEvent.recordingEventIsIframe;
            //then the class needs to provide log messages
            this.logMessages = [];
            //then the class needs to provide warning messages
            this.warningMessages = [];
            
            if (!this.isIframe) {

                this.selectedItem = await new Promise(resolve => chrome.debugger.sendCommand(
                    { tabId: this.browserTabId }, 
                    "Runtime.evaluate",
                    {expression: `document.querySelector('${this.selectorString}');`},
                    value => {
                        //report to the console if error
                        if (chrome.runtime.lastError) { console.log("QUERY SELECTOR ERROR", chrome.runtime.lastError.message); }
                        console.log(`QUERY SELECTOR RESULT ${JSON.stringify(value.result)}`);
                        resolve(value.result);
                    }
                ));

                //if the item is null, it cannot be found in the document
                if (this.selectedItem == null) {
                    //so we need to report an invalid selector and return the object
                    this.invalidSelector = true;
                    //then give some feedback
                    this.warningMessages.push(`${this.selectorKey} Selector Returned Null`);
                    //this is an early exit as there's nothing more to do
                    return this;
                }

                //if the item does not have the same tagname we need to return
                if (this.selectedItem.className != this.targetHtmlElement) {
                    //so the CSS selector has found an element but it does not match by tag name
                    this.invalidSelector = true;
                    //then give some feedback
                    this.warningMessages.push(`${this.selectorKey} Unmatched Html Element ${this.selectedItem.className}`);
                    //this is an early exit as there's nothing more to do
                    return this;
                }

                //so we have a good selector, lets just get the outerhtml so we can inspect reports
                this.selectedItem = this.selectedItem.className;
                //then we report good finish
                this.logMessages.push(`${this.selectorKey} Found in Document`);
                //and we're done - always remember to return this to the constructor in an async function or the whole thing is pointless
                return this; 

            } else {

                //for iframes its a bit more complicated

            }

        })();

    }

}
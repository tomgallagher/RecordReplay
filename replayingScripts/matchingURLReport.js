class MatchingUrlReport {

    constructor(replayEvent) {

        //we need to work out if the incoming message is intended for this content script - this can be complex with iframes which change their search params
        this.contentScriptUrl = new URL(window.location.href);
        this.eventTargetUrl = new URL(replayEvent.recordingEventLocationHref);
        //we start with the assumption that the urls are not going to match
        this.matched = false;
        //then we need to take some decisions based on the comparison between the two urls
        switch(true){
            //this differentiates host pages from third party iframes
            case this.contentScriptUrl.origin != this.eventTargetUrl.origin:
                //no match so we just log this for debugging and then break
                EventReplayer.logWithContext(`Not Replaying ${replayEvent.assertionId || replayEvent.replayEventId} from Unmatched Origin`);
                break;
            //this differentiates host pages from same domain iframes
            case this.contentScriptUrl.pathname != this.eventTargetUrl.pathname:
                //no match so we just log this for debugging and then break
                EventReplayer.logWithContext(`Not Replaying ${replayEvent.assertionId || replayEvent.replayEventId} from Unmatched Path`);
                break;
            //then we need to look in more detail at search params, which can vary on each loading of same domain or third party iframes
            case this.contentScriptUrl.search != this.eventTargetUrl.search:
                //we are going to need an object for each set of search params to make a more detailed judgment
                const contentScriptSearchParams = Object.fromEntries(this.contentScriptUrl.searchParams);
                const eventTargetSearchParams = Object.fromEntries(this.eventTargetUrl.searchParams);
                //so we can look for the equivalence is keys length by getting the keys array from each object
                const contentScriptKeys = Object.keys(contentScriptSearchParams);
                const eventTargetKeys = Object.keys(eventTargetSearchParams);
                //then work out if the length matches
                const lengthMatched = contentScriptKeys.length == eventTargetKeys.length;
                //then work out if the keys are the same, even if the values might have changed, using stringify to enable comparison of keys array
                const keysMatched = JSON.stringify(contentScriptKeys) == JSON.stringify(eventTargetKeys);
                //if they both match then it's a decent guess we are operating in the right ifrAme
                if (lengthMatched && keysMatched) {
                    //then we can return true
                    EventReplayer.logWithContext(`Matched Location On Search Params Key Equivalence: Executing ${replayEvent.assertionId || replayEvent.replayEventId}`);
                    this.matched = true;
                } else {
                    //otherwise we need to report 
                    EventReplayer.logWithContext(`Not Replaying ${replayEvent.assertionId || replayEvent.replayEventId} from Unmatched Search Params`);
                }
                break;
            //when we have no fails on the url we are left with the possibliliy that we are in the main page or we are in a vanilla iframe
            //the problem we have is that the main page can contain many vanilla iframes
            default:
                //so we need to have a further level of nested logic here
                switch(true){
                    //we discard cases where the frame/main page context is different from the recorded context
                    case EventReplayer.contextIsIframe() != replayEvent.recordingEventIsIframe:
                        //no match so we just log this for debugging and then break
                        EventReplayer.logWithContext(`Not Replaying ${replayEvent.assertionId || replayEvent.replayEventId} from Unmatched Main Page / Frame Context`);
                        break;
                    //we need to action events where the context indicates an iframe match
                    case EventReplayer.contextIsIframe() && replayEvent.recordingEventIsIframe:
                        //then we know we are in an iframe, which is where we want to be BUT we need to distinguish between iframes
                        if (replayEvent.recordingEventIframeName ==  window.frameElement.name) {
                            //we may have problems here if we get multiple vanilla iframes all with the same name
                            EventReplayer.logWithContext(`Matched Vanilla Iframe on Name: Executing ${replayEvent.assertionId || replayEvent.replayEventId}`);
                            this.matched = true;
                        } else {
                            //otherwise we need to report 
                            EventReplayer.logWithContext(`Not Replaying ${replayEvent.assertionId || replayEvent.replayEventId} from Unmatched Vanilla Iframe Name`);
                        }
                        break;
                    //we need to action events where the context indicates a main frame match
                    case !EventReplayer.contextIsIframe() && !replayEvent.recordingEventIsIframe:
                        EventReplayer.logWithContext(`Matched Main Frame Location: Executing ${replayEvent.assertionId || replayEvent.replayEventId}`);
                        this.matched = true;
                }

        }

    }

}
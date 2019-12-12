class MatchingUrlReport {

    constructor(replayEvent) {

        //we need to work out if the incoming message is intended for this content script - this can be complex with iframes which change their search params
        this.contentScriptUrl = new URL(window.location.href);
        this.eventTargetUrl = new URL(replayEvent.recordingEventLocationHref);
        //then we need to take some decisions based on the comparison between the two urls
        switch(true){
            //this differentiates host pages from third party iframes
            case this.contentScriptUrl.origin != this.eventTargetUrl.origin:
                EventReplayer.logWithContext(`Not Replaying ${replayEvent.assertionId || replayEvent.replayEventId} from Unmatched Origin`);
                return false;
            //this differentiates host pages from same domain iframes
            case this.contentScriptUrl.pathname != this.eventTargetUrl.pathname:
                EventReplayer.logWithContext(`Not Replaying ${replayEvent.assertionId || replayEvent.replayEventId} from Unmatched Path`);
                return false;
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
                    return true;
                } else {
                    //otherwise we need to report 
                    EventReplayer.logWithContext(`Not Replaying ${replayEvent.assertionId || replayEvent.replayEventId} from Unmatched Search Params`);
                    return false;
                }
            //when we have no fails then we can just return true
                default:
                    EventReplayer.logWithContext(`Matched Location: Executing ${replayEvent.assertionId || replayEvent.replayEventId}`);
                    return true;

        }

    }

}
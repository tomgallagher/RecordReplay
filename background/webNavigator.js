class WebNavigator {
    constructor() {
        //we need to have a list of all the web navigation events that we care about
        this.monitoredEvents = ['onBeforeNavigate', 'onCommitted', 'onDOMContentLoaded', 'onCompleted'];
        //then we need to transform these events into an array of observables that we can monitor at the same time
        this.monitoredEventsObservables = this.monitoredEvents.map((eventName) =>
            Rx.Observable.fromEventPattern(
                //we add the handler that takes the callback object from the debugger event and passes it to subscribers
                (handler) => {
                    //then we want to slightly adjust the output of each observable so we can distinguish the type of event
                    const wrapper = (webNavigationEvent) => {
                        //we want to add our own unique identifier
                        const recordReplayWebNavigationEvent = Object.assign({}, webNavigationEvent, {
                            recordReplayWebNavigationEvent: eventName,
                        });
                        //then send that to the handler
                        handler(recordReplayWebNavigationEvent);
                    };
                    //then we add the wrapper to the webnavigation listener
                    chrome.webNavigation[eventName].addListener(wrapper);
                    //then we return the wrapper so we can unsubscribe
                    return wrapper;
                },
                //we add the wrapper to the removeListener function
                (wrapper) => chrome.webNavigation[eventName].removeListener(wrapper)
            )
        );
        //then we create our navigation events observable for access by users and we leave the business of subscribing and unsubscribing to them
        //this will push out all events, for all frames, so all subscribers need to .filter(obj => obj.recordReplayNavigationType == "onCommitted" && obj.frameId == 0)
        this.navigationEventsObservable = Rx.Observable.merge(...this.monitoredEventsObservables).share();
    }
}

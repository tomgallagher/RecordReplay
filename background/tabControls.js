const createTab = (url) => {
    return new Promise((resolve) => {
        chrome.tabs.create({ url: url }, (tab) => {
            resolve({
                tabId: tab.id,
                pendingUrl: tab.pendingUrl,
                status: tab.status,
            });
        });
    });
};
const waitForLoad = (tabID) => {
    return new Promise((resolve) => {
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (info.status === 'complete' && tabId === tabID) {
                chrome.tabs.onUpdated.removeListener(listener);
                console.log(`Tab Runner: Debugger tab has loaded. Ready to attach debugger`);
                resolve(tabID);
            }
        });
    });
};

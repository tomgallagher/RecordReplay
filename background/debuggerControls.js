//DEBUGGER COMMANDS - the purpose of all of these is to wrap the callbacks into promises we can work with

const attachDebugger = (tabID) => {
    return new Promise((resolve, reject) => {
        chrome.debugger.attach({ tabId: tabID }, '1.3', function (response) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError.message);
                return;
            }
            resolve(response);
        });
    });
};

const enableNetworkEvents = (tabID) => {
    return new Promise((resolve, reject) => {
        chrome.debugger.sendCommand({ tabId: tabID }, 'Network.enable', {}, function (response) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError.message);
                return;
            }
            resolve(response);
        });
    });
};

const clearCache = (tabID) => {
    return new Promise((resolve, reject) => {
        chrome.debugger.sendCommand({ tabId: tabID }, 'Network.clearBrowserCache', function (response) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError.message);
                return;
            }
            resolve(response);
        });
    });
};

const disableCache = (tabID) => {
    return new Promise((resolve, reject) => {
        chrome.debugger.sendCommand(
            { tabId: tabID },
            'Network.setCacheDisabled',
            { cacheDisabled: true },
            function (response) {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError.message);
                    return;
                }
                resolve(response);
            }
        );
    });
};

const enablePageEvents = (tabID) => {
    return new Promise((resolve, reject) => {
        chrome.debugger.sendCommand({ tabId: tabID }, 'Page.enable', {}, function (response) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError.message);
                return;
            }
            resolve(response);
        });
    });
};

const setNetworkConditions = (tabID, latency, downloadSpeed, uploadSpeed) => {
    return new Promise((resolve, reject) => {
        chrome.debugger.sendCommand(
            { tabId: tabID },
            'Network.emulateNetworkConditions',
            {
                offline: false,
                latency: latency,
                downloadThroughput: downloadSpeed,
                uploadThroughput: uploadSpeed,
            },
            function (response) {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError.message);
                    return;
                }
                resolve(response);
            }
        );
    });
};

const emulateDevice = (tabID, deviceId, orientation) => {
    return new Promise((resolve, reject) => {
        //first we need to get a reference to the mobile device list
        const mobileDevices = new MobileDeviceDictionary({});
        //then we need to find our device
        const device = mobileDevices[deviceId];
        //then send the command
        chrome.debugger.sendCommand(
            { tabId: tabID },
            'Emulation.setDeviceMetricsOverride',
            {
                width: device.width || 360,
                height: device.height || 640,
                mobile: true,
                deviceScaleFactor: device.deviceScaleFactor,
                screenOrientation:
                    orientation == 'portrait'
                        ? { angle: 0, type: 'portraitPrimary' }
                        : { angle: 90, type: 'landscapePrimary' },
            },
            function (response) {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError.message);
                    return;
                }
                resolve(response);
            }
        );
    });
};

const isDebuggerAttached = (tabID) => {
    return new Promise((resolve) => {
        chrome.debugger.getTargets((targetInfoArray) => {
            if (chrome.runtime.lastError) {
                resolve(false);
                return;
            }
            const isAttached = targetInfoArray.some((target) => target.tabId === tabID && target.attached);
            resolve(isAttached);
        });
    });
};

const stopDebugger = (tabId) => {
    return new Promise((resolve, reject) => {
        disableNetworkEvents(tabId)
            .then(() => disablePageEvents(tabId))
            .then(() => detachDebugger(tabId))
            .then(() => resolve())
            .catch((e) => reject(e));
    });
};

const detachDebugger = (tabID) => {
    return new Promise((resolve, reject) => {
        chrome.debugger.detach({ tabId: tabID }, function (response) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError.message);
                return;
            }
            resolve(response);
        });
    });
};

const disableNetworkEvents = (tabID) => {
    return new Promise((resolve, reject) => {
        chrome.debugger.sendCommand({ tabId: tabID }, 'Network.disable', {}, function (response) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError.message);
                return;
            }
            resolve(response);
        });
    });
};

const disablePageEvents = (tabID) => {
    return new Promise((resolve, reject) => {
        chrome.debugger.sendCommand({ tabId: tabID }, 'Page.disable', {}, function (response) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError.message);
                return;
            }
            resolve(response);
        });
    });
};

const executeScriptInMainFrame = (tabID, code) => {
    return new Promise((resolve, reject) => {
        chrome.tabs.executeScript(tabID, { code: code, runAt: 'document_idle' }, function (response) {
            if (chrome.runtime.lastError) {
                console.log(chrome.runtime.lastError.message);
                return;
            }
            resolve(response);
        });
    });
};

const executeScriptInSubFrame = (tabID, code, frameId) => {
    return new Promise((resolve, reject) => {
        chrome.tabs.executeScript(tabID, { code: code, frameId: frameId, runAt: 'document_idle' }, function (response) {
            if (chrome.runtime.lastError) {
                console.log(chrome.runtime.lastError.message);
                return;
            }
            resolve(response);
        });
    });
};

const sendKeyboardEvent = (tabID, event) => {
    return new Promise((resolve, reject) => {
        chrome.debugger.sendCommand({ tabId: tabID }, 'Input.dispatchKeyEvent', event, () => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError.message);
                return;
            }
            resolve();
        });
    });
};

const takeScreenshot = (tabID) => {
    return new Promise((resolve, reject) => {
        //we need to have focus on the tab we are taking the screenshot from
        chrome.tabs.update(tabID, { highlighted: true }, () => {
            //send the command to the debugger
            chrome.debugger.sendCommand(
                //always use our tab ID
                { tabId: tabID },
                //send the screenshot command
                'Page.captureScreenshot',
                //then the image params
                { format: 'jpeg', quality: 100 },
                //this returns string of Base64-encoded image data
                (data) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError.message);
                        return;
                    }
                    //then resolve
                    resolve(data);
                }
            );
        });
    });
};

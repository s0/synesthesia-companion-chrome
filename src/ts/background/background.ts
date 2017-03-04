chrome.runtime.onConnectExternal.addListener(port => {
  port.onMessage.addListener(msg => {
    console.debug("got message", msg);
    port.postMessage(msg);
  });
});

chrome.runtime.onConnectExternal.addListener(function(port) {
  port.onMessage.addListener(function(msg) {
    console.debug("got message", msg);
    port.postMessage(msg);
  });
});

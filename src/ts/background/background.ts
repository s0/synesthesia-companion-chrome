const media: MediaTab[] = [];
const listeners: ((state?: PlayState) => void)[] = [];

enum Mode {
  UNKNOWN,
  TAB,
  COMPOSER
}

function updateListeners() {
  console.debug('updateListeners', media, listeners);
  for (const l of listeners)
    updateListener(l);
}

function updateListener(listener: (state?: PlayState) => void) {
  for (const m of media) {
    if (m.state) {
      listener(m.state);
      return;
    }
  }
  listener(undefined);
}

function connectionListener(port: chrome.runtime.Port) {
  let mode = Mode.UNKNOWN;

  function initTab() {
    console.debug('initTab');
    mode = Mode.TAB;
  }

  function initComposer() {
    mode = Mode.COMPOSER;
  }

  function handleTabMessage(msg: TabMessage) {
    console.debug('handleTabMessage', msg);
  }

  function handleComposerMessage(msg: ComposerMessage) {
    console.debug('handleComposerMessage', msg);
    listeners.push(listener);
    updateListener(listener);
  }

  function handleTabClosed() {
    console.debug('handleTabClosed()');
  }

  function handleComposerClosed() {
    console.debug('handleComposerClosed()');
    const i = listeners.indexOf(listener);
    listeners.splice(i, 1);
  }

  function listener(state: PlayState) {
    port.postMessage(state);
  }

  // Setup Port Listeners
  port.onMessage.addListener(msg => {
    switch(mode) {
      case Mode.UNKNOWN:
        switch ((msg as InitMessage).mode) {
          case "tab":
            initTab();
            return;
          case "composer":
            initComposer();
            return;
        }
      case Mode.TAB:
        handleTabMessage(msg as TabMessage);
        return;
      case Mode.COMPOSER:
        handleComposerMessage(msg as ComposerMessage);
        return;
    }
  });
  port.onDisconnect.addListener(() => {
    switch(mode) {
      case Mode.UNKNOWN:
        return;
      case Mode.TAB:
        handleTabClosed();
        return;
      case Mode.COMPOSER:
        handleComposerClosed();
        return;
    }
  })
};

chrome.runtime.onConnectExternal.addListener(connectionListener);
chrome.runtime.onConnect.addListener(connectionListener);

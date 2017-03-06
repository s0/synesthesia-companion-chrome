const tabs: C.MediaTab[] = [];
const listeners: ((state?: C.PlayState) => void)[] = [];

enum Mode {
  UNKNOWN,
  TAB,
  COMPOSER
}

function updateListeners() {
  for (const l of listeners)
    updateListener(l);
}

function updateListener(listener: (state?: C.PlayState) => void) {
  for (const t of tabs) {
    if (t.state) {
      listener(t.state);
      return;
    }
  }
  listener(undefined);
}

function connectionListener(port: chrome.runtime.Port) {
  let mode = Mode.UNKNOWN;
  let tabData: C.MediaTab;

  function initTab() {
    console.debug('initTab');
    mode = Mode.TAB;
    tabs.push(tabData = {state: null, art: null});
  }

  function initComposer() {
    mode = Mode.COMPOSER;
  }

  function handleTabMessage(msg: C.TabMessage) {
    console.debug('handleTabMessage', msg);
    let updated = false;
    if (msg.updatePlayState) {
      tabData.state = msg.updatePlayState.state;
      updated = true;
    }
    if (msg.updateAlbumArt) {
      tabData.art = msg.updateAlbumArt.art;
      updated = true;
    }
    if (updated) {
      // TODO: move this tab to the front of list
      updateListeners();
    }
  }

  function handleComposerMessage(msg: C.ComposerMessage) {
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

  function listener(state: C.PlayState) {
    port.postMessage(state);
  }

  // Setup Port Listeners
  port.onMessage.addListener(msg => {
    switch(mode) {
      case Mode.UNKNOWN:
        switch ((msg as C.InitMessage).mode) {
          case "tab":
            initTab();
            return;
          case "composer":
            initComposer();
            return;
        }
      case Mode.TAB:
        handleTabMessage(msg as C.TabMessage);
        return;
      case Mode.COMPOSER:
        handleComposerMessage(msg as C.ComposerMessage);
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

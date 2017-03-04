interface PlayState {
  length: number;
}

interface MediaTab {
  state?: PlayState;
}

const media: MediaTab[] = [];
const listeners: ((state?: PlayState) => void)[] = [];

enum Mode {
  UNKNOWN,
  TAB,
  COMPOSER
}

interface InitMessage {
  mode: "tab" | "composer";
}

interface TabMessage {

}

interface ComposerMessage {

}

function addDemoMedia() {
  setTimeout(() => {
    const m: MediaTab = {

    };
    media.push(m);
    updateListeners()
    setTimeout(() => {
      m.state = {
        length: 1000
      };
      updateListeners();
    }, 2000);
    setTimeout(() => {
      m.state = undefined;
      updateListeners();
    }, 4000);
  }, 2000);
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


chrome.runtime.onConnectExternal.addListener(port => {
  let mode = Mode.UNKNOWN;

  function initTab() {
    mode = Mode.TAB;
  }

  function initComposer() {
    mode = Mode.COMPOSER;
    addDemoMedia();
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
});

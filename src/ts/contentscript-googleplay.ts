($ => {

  console.log("Inserted contentscript");

  let update_timeout = 0,
  $player = $('#player'),
  lastState: PlayState | null = null,
  album_art_url: string | null = null;

  // Connect to background script
  const port = chrome.runtime.connect();
  port.onMessage.addListener(msg => {
    console.log('msg', msg);
  });
  const initMessage: InitMessage = {
    mode: 'tab'
  };
  port.postMessage(initMessage);

  // Listen for changes in DOM
  $player.bind('DOMSubtreeModified', () => {
    clearTimeout(update_timeout);
    update_timeout = setTimeout(update_state, 50);
  });
  update_timeout = setTimeout(update_state, 50);

  function control() {
    // Create closure (on demand) for functions requiring control access
    // (created on demand and disposed of as elems change over the lifetime
    // of page)
    let changed = false;
    const $buttons = $('.material-player-middle:first'),
          $play_pause = $buttons.children('[data-id=play-pause]:first'),
          $next = $buttons.children('[data-id=forward]:first'),
          $prev = $buttons.children('[data-id=rewind]:first'),
          $player_song_info = $('#playerSongInfo'),
          $title = $player_song_info.find('#currently-playing-title'),
          $artist = $player_song_info.find('#player-artist'),
          $album = $player_song_info.find('.player-album:first'),
          $slider = $('paper-slider');

    return {
      update_state: () => {
        let newState: PlayState | null = null;
        if ($player_song_info.children().length > 0) {

          // Meta Info
          const title = $title ? $title.text() : null;
          const artist = $artist ? $artist.text() : null;
          const album = $album ? $album.text() : null;

          // Album Art
          const new_album_art_url = $('#playerBarArt').attr('src');

          if (album_art_url != new_album_art_url) {
            convertImgToBase64(new_album_art_url, base64 => {
              port.postMessage({key: "album_art", value: base64})
            }, "image/png");
          }

          album_art_url = new_album_art_url;

          // Play state
          const state: 'playing' | 'paused' = $play_pause.hasClass('playing') ? 'playing' : 'paused';
          const sliderValue = Number($slider.attr('value'));
          const stateValue = state === 'playing' ? (new Date().getTime() - sliderValue) : sliderValue;

          newState = {
            length: Number($slider.attr('aria-valuemax')),
            title,
            artist,
            album,
            state,
            stateValue
          };
        }

        if (stateChanged(lastState, newState)) {
          lastState = newState;
          send_state();
        }
      },
      toggle: () => $play_pause.click(),
      next: () => $next.click(),
      prev: () => $prev.click()
    }
  }

  function stateChanged(old: PlayState | null, newState: PlayState | null) {
    // If only one is null, it has changed
    if ((old === null || newState === null) && old !== newState)
      return true;
    // Check properties changes
    // TODO
    return true;
  }

  function update_state(){
    control().update_state()
  }

  function send_state(){
    console.debug("send_state")
    port.postMessage({key: "play_state", value: lastState});
  }

  function convertImgToBase64(
    url: string,
    callback: (dataUrl: string) => void,
    outputFormat: "image/png"){
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx === null)
        throw new Error("null context");
      const img = new Image;
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        canvas.height = Math.min(img.height, 62);
        canvas.width = Math.min(img.width, 62);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataURL = canvas.toDataURL(outputFormat);
        callback.call(this, dataURL);
      };
      img.src = url;
    }

  })(jQuery)

(function($){
  "use strict";

  $(document).ready(function(){
    var video = [];
    setTimeout(function(){
      $( ".fluid-width-video-wrapper" ).each(function(key,value){
        console.log(isScrolledIntoView($(".fluid-width-video-wrapper")));
        if (isScrolledIntoView(this)) {
            var get_id = $(this).find("iframe").attr("id");
            callPlayer(get_id, "playVideo");
        } else {
            var get_id = $(this).find("iframe").attr("id");
            callPlayer(get_id, "pauseVideo");
        }
      });

      $(window).scroll(function(){


        $(".fluid-width-video-wrapper").each(function() {
            if (isScrolledIntoView(this)) {
                var get_id = $(this).find("iframe").attr("id");
                callPlayer(get_id, "playVideo");
            } else {
                var get_id = $(this).find("iframe").attr("id");
                callPlayer(get_id, "pauseVideo");
            }
        });

      });

    },1000);

  });

  function callPlayer(frame_id, func, args) {
      if (window.jQuery && frame_id instanceof jQuery) frame_id = frame_id.get(0).id;
      var iframe = document.getElementById(frame_id);
      if (iframe && iframe.tagName.toUpperCase() != 'IFRAME') {
          iframe = iframe.getElementsByTagName('iframe')[0];
      }

      // When the player is not ready yet, add the event to a queue
      // Each frame_id is associated with an own queue.
      // Each queue has three possible states:
      //  undefined = uninitialised / array = queue / 0 = ready
      if (!callPlayer.queue) callPlayer.queue = {};
      var queue = callPlayer.queue[frame_id],
          domReady = document.readyState == 'complete';

      if (domReady && !iframe) {
          // DOM is ready and iframe does not exist. Log a message
          window.console && console.log('callPlayer: Frame not found; id=' + frame_id);
          if (queue) clearInterval(queue.poller);
      } else if (func === 'listening') {
          // Sending the "listener" message to the frame, to request status updates
          if (iframe && iframe.contentWindow) {
              func = '{"event":"listening","id":' + JSON.stringify(''+frame_id) + '}';
              iframe.contentWindow.postMessage(func, '*');
          }
      } else if (!domReady ||
                 iframe && (!iframe.contentWindow || queue && !queue.ready) ||
                 (!queue || !queue.ready) && typeof func === 'function') {
          if (!queue) queue = callPlayer.queue[frame_id] = [];
          queue.push([func, args]);
          if (!('poller' in queue)) {
              // keep polling until the document and frame is ready
              queue.poller = setInterval(function() {
                  callPlayer(frame_id, 'listening');
              }, 250);
              // Add a global "message" event listener, to catch status updates:
              messageEvent(1, function runOnceReady(e) {
                  if (!iframe) {
                      iframe = document.getElementById(frame_id);
                      if (!iframe) return;
                      if (iframe.tagName.toUpperCase() != 'IFRAME') {
                          iframe = iframe.getElementsByTagName('iframe')[0];
                          if (!iframe) return;
                      }
                  }
                  if (e.source === iframe.contentWindow) {
                      // Assume that the player is ready if we receive a
                      // message from the iframe
                      clearInterval(queue.poller);
                      queue.ready = true;
                      messageEvent(0, runOnceReady);
                      // .. and release the queue:
                      while (tmp = queue.shift()) {
                          callPlayer(frame_id, tmp[0], tmp[1]);
                      }
                  }
              }, false);
          }
      } else if (iframe && iframe.contentWindow) {
          // When a function is supplied, just call it (like "onYouTubePlayerReady")
          if (func.call) return func();
          // Frame exists, send message
          iframe.contentWindow.postMessage(JSON.stringify({
              "event": "command",
              "func": func,
              "args": args || [],
              "id": frame_id
          }), "*");
      }
      /* IE8 does not support addEventListener... */
      function messageEvent(add, listener) {
          var w3 = add ? window.addEventListener : window.removeEventListener;
          w3 ?
              w3('message', listener, !1)
          :
              (add ? window.attachEvent : window.detachEvent)('onmessage', listener);
      }
  }

  function isScrolledIntoView(elem)
  {
      var $elem = $(elem);
      var $window = $(window);

      var docViewTop = $window.scrollTop();
      var docViewBottom = docViewTop + $window.height();

      var elemTop = $elem.offset().top;
      var elemBottom = elemTop + ($elem.find('iframe').height() / 1.5);
      var elemTop = $elem.offset().top + ($elem.find('iframe').height() / 6.5);
      console.log(elemTop + "-" + docViewBottom);

      return ((elemBottom >= "" + docViewTop) && (elemTop <= docViewBottom));
  }


})(this.jQuery);

(function($){
  "use strict";

  $(document).ready(function(){
    var video = [];
    $('iframe').iframeTracker({
        blurCallback: function(){
          console.log(this._overId);
          if($(this._overId).hasClass("scrollover")){
            $(this._overId).removeClass("scrollover");
          }else{
            $(this._overId).addClass("scrollover");
          }
            // Do something when the iframe is clicked (like firing an XHR request)
        },
        overCallback: function(element){
          //$(element).remove("scrollover");

            this._overId = $(element);
              console.log(this._overId);
          //  this._overId = $(element).parents('.iframe_wrap').attr('id'); // Saving the iframe wrapper id
        },
    });
    setTimeout(function(){
      $( ".fluid-width-video-wrapper" ).each(function(key,value){
        $(this).find("iframe").addClass("scrollover");
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

            if (isScrolledIntoView(this) && $(this).find('iframe').hasClass("scrollover")) {
              if($(this).parent(".embed-container").hasClass("youtube")){
                var get_id = $(this).find("iframe").attr("id");
                callPlayer(get_id, "playVideo");
              }else if($(this).parent(".embed-container").hasClass("vimeo")){
                var iframe = $(this).find('iframe')[0];
                var player = $f(iframe);
                player.api('play');
              }
            } else {
              if($(this).parent(".embed-container").hasClass("youtube")){
                var get_id = $(this).find("iframe").attr("id");
                callPlayer(get_id, "pauseVideo");
              }else if($(this).parent(".embed-container").hasClass("vimeo")){
                var iframe = $(this).find('iframe')[0];
                var player = $f(iframe);
                player.api('pause');
              }
            }

        });

        $("video.wp-video-shortcode").each(function() {
        //  if (isScrolledIntoView(this)) {
        //      $(this).play();
        //  } else {
        //      $(this).pause();
        //  }
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

      function onMessageReceived(event) {
        // Handle messages from the vimeo player only
        if (!(/^https?:\/\/player.vimeo.com/).test(event.origin)) {
            return false;
        }

        if (playerOrigin === '*') {
            playerOrigin = event.origin;
        }

        var data = JSON.parse(event.data);

        switch (data.event) {
            case 'ready':
                onReady();
                break;

            case 'playProgress':
                onPlayProgress(data.data);
                break;

            case 'pause':
                onPause();
                break;

            case 'finish':
                onFinish();
                break;
        }
    }

    // Call the API when a button is pressed
    $('button').on('click', function() {
        post($(this).text().toLowerCase());
    });

    // Helper function for sending a message to the player
    function post(action, value) {
        var data = {
          method: action
        };

        if (value) {
            data.value = value;
        }

        var message = JSON.stringify(data);
        player[0].contentWindow.postMessage(data, playerOrigin);
    }

    function onReady() {
        status.text('ready');

        post('addEventListener', 'pause');
        post('addEventListener', 'finish');
        post('addEventListener', 'playProgress');
    }

    function onPause() {
        status.text('paused');
    }

    function onFinish() {
        status.text('finished');
    }

    function onPlayProgress(data) {
        status.text(data.seconds + 's played');
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

      return ((elemBottom >= "" + docViewTop) && (elemTop <= docViewBottom));
  }


})(this.jQuery);

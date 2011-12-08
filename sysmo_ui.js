(function(Sysmo, window, document, undefined) {
  
  if (!Sysmo) throw Error("Sysmo is required to load Sysmo.UI");
  
  var is_loading = false,
    display_message = true,
    loading_messages = [],
    loaded_timer,
    default_timeout = 250,
    loading_message = function(message, timeout, callback) {
      clearTimeout(loaded_timer);
      //if (message) {
        if (display_message) {
          var next = function() {
            callback && callback();
            display_message = true;
            var args = loading_messages.shift();
            args && loading_message.apply(this, args);
          };
          if (message) {
            $("#loading_message")/*.hide()*/.html(message);//.text(message)/*.fadeIn('fast')*/;
            display_message = false;
            setTimeout(next, timeout)
          } else {
            next();
          }
        } else {
          loading_messages.push([message, timeout, callback]);
        }
      //}
    },
    loading_resizer = function() {
      //$('.blockUI.blockPage').centerH();
      //$('.blockUI.blockPage').centerV();
      $('.blockUI.blockPage').center();
    },
    loaded_finalizer = function(timeout, callback) {
      return setTimeout(function() {
        $(window).unbind('resize', loading_resizer);
        $.unblockUI({ onUnblock: callback });
        //$("#loading_message").fadeOut('fast');
        is_loading = false;
      }, timeout);
    },
    loading = function (message, timeout) {
      return Sysmo.arrangeArgs(arguments, 
        String, [Number, false, default_timeout], 
        function(message, timeout) {
          
          if (!is_loading) {
            $.blockUI();
            loading_resizer();
            $(window).resize(loading_resizer);
          }
          
          loading_message(message, timeout);
          is_loading = true;
        });
    },
    loaded = function () {
      return Sysmo.arrangeArgs(arguments, 
        String, [Number, false, default_timeout], Function, 
        function(message, timeout, callback) {
          loading_message(message, default_timeout, function() {
            loaded_timer = loaded_finalizer(timeout, callback);
          });
        });
    };
  
  Sysmo.include('UI', {
    loading: loading,
    loaded: loaded
  });

})(window.Sysmo, window, document);
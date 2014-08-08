(function() {
  "use strict";

  var app = angular.module("sockjs", []);

  app.provider("sockjsFactory", function() {
    this.$get = function($timeout) {
      return function(options) {
        options = options || {};
        var sock = options.sock || new SockJS(options.url);

        var wrapped = {
          callbacks: {},
          setHandler: function(event, callback) {
            if (!callback) callback = angular.noop;
            else {
              callback = function() {
                $timeout(function() { callback.apply(sock, arguments); });
              };
            }
            sock["on" + event] = callback;
            return this;
          },
          removeHandler: function(event) {
            delete sock["on" + event];
            return this;
          },
          send: function() {
            return sock.send.apply(sock, arguments);
          },
          close: function() {
            return sock.close.apply(sock, arguments);
          }
        };

        return wrapped;
      };
    };
  });
})();

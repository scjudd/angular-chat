(function() {
  "use strict";

  var app = angular.module("chat", []);
  var sock = new SockJS("/chat");

  app.service("serializeMessage", function() {
    return JSON.stringify;
  });

  app.service("deserializeMessage", function() {
    return function(serialized) {
      var msg = JSON.parse(serialized);
      if (msg.date) msg.date = new Date(msg.date);
      return msg;
    };
  });

  // NOTE: This directive only makes sense in the context of a single
  // element requiring keyboard interaction.
  app.directive("refocus", function($document) {
    return function(scope, elem, attrs) {
      var registered = false;
      elem.on("blur", function() {
        if (!registered) {
          $document.one("keypress", function() {
            elem[0].focus();
            registered = false;
          });
          registered = true;
        }
      });
      elem[0].focus();
    };
  });

  app.directive("heightDifference", function($window) {
    return function(scope, elem, attrs) {
      function resize() {
        var rh = parseInt(attrs.heightDifference);
        elem[0].style.height = ($window.innerHeight - rh) + "px";
      }
      angular.element($window).on("resize", resize);
      resize();
    };
  });

  app.directive("autoscroll", function() {
    return function(scope, elem, attrs) {
      var scrollHeight = function() { return elem[0].scrollHeight; };
      scope.$watch(scrollHeight, function() {
        elem[0].scrollTop = scrollHeight();
      });
    };
  });

  app.controller("ChatCtrl", function($scope, $window, serializeMessage, deserializeMessage) {
    $scope.messages = [];
    $scope.messageText = "";
    $scope.colors = {};

    function getRandomColor() {
      var hue = Math.floor(Math.random() * 360);
      return "hsl(" + hue + ", 100%, 30%)"
    }

    function send(msg) {
      sock.send(serializeMessage(msg));
    };

    $scope.sendMessage = function() {
      if ($scope.messageText.length > 0) {
        if ($scope.messageText.indexOf("/nick") == 0) {
          var nick = $scope.messageText.replace("/nick ","").split(" ")[0];
          send({type: "nick", new: nick});
        } else {
          send({type: "message", text: $scope.messageText});
        }
        $scope.messageText = "";
      }
    };

    sock.onmessage = function(e) {
      var msg = deserializeMessage(e.data);
      if (msg.id !== undefined) {
        if (!(msg.id in $scope.colors))
          $scope.colors[msg.id] = getRandomColor();
        msg.color = $scope.colors[msg.id];
      }
      $scope.messages.push(msg);
      $scope.$apply();
    };
  });

})();

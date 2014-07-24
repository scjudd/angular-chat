(function() {
  "use strict";

  var app = angular.module("chat", []);
  var sock = new SockJS("/chat");

  function parseMessage(serialized) {
    var msg = JSON.parse(serialized);
    if (msg.date) msg.date = new Date(msg.date);
    return msg;
  }

  app.controller("ChatCtrl", function($scope, $window) {

    // elements
    var input = document.querySelector("input");
    var messages = document.querySelector(".messages");

    // received messages
    $scope.messages = [];

    // send message
    $scope.sendMessage = function() {
      sock.send($scope.messageText);
      $scope.messageText = "";
    };

    // on messages receive
    sock.onmessage = function(e) {
      var msg = parseMessage(e.data);
      $scope.messages.push(msg);
      $scope.$apply();
      messages.scrollTop = messages.scrollHeight;
    };

    // resize messages container on load/resize
    function resizeMessagesContainer() {
      messages.style.height = $window.innerHeight - 69 + "px";
    }
    angular.element($window).bind("resize", resizeMessagesContainer);
    resizeMessagesContainer();

    // focus input on keypress
    angular.element(input).bind("blur", function() {
      angular.element(document).bind("keypress", function(e) {
        input.focus();
        angular.element(document).unbind("keypress");
      });
    });

  });

})();

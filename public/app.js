(function() {
  "use strict";

  var app = angular.module("chat", []);
  var sock = new SockJS("/chat");

  app.service("deserializeMessage", function() {
    return function(serialized) {
      var msg = JSON.parse(serialized);
      if (msg.date) msg.date = new Date(msg.date);
      return msg;
    };
  });

  app.directive("refocus", function($document) {
    return function(scope, elem, attrs) {
      elem.on("blur", function() {
        $document.one("keypress", elem[0].focus);
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

  app.controller("ChatCtrl", function($scope, $window, deserializeMessage) {
    $scope.messages = [];

    $scope.sendMessage = function() {
      sock.send($scope.messageText);
      $scope.messageText = "";
    };

    sock.onmessage = function(e) {
      var msg = deserializeMessage(e.data);
      $scope.messages.push(msg);
      $scope.$apply();
    };
  });

})();

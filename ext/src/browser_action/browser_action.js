var _gaq = _gaq || [];
_gaq.push([ '_setAccount', 'UA-687332-7' ]);
_gaq.push([ '_trackPageview' ]);

(function() {
	var ga = document.createElement('script');
	ga.type = 'text/javascript';
	ga.async = true;
	ga.src = 'https://ssl.google-analytics.com/ga.js';
	var s = document.getElementsByTagName('script')[0];
	s.parentNode.insertBefore(ga, s);
})();


function trackEvent(eventId) {
	_gaq.push([ '_trackEvent', eventId, 'clicked' ]);
};

var uocApp = angular.module('uocApp', []);



uocApp.controller('UOChromeCtrl', function($scope,$log) {
	$scope.aulas = [];	
	$scope.session = '';
	$scope.unreadmessages = 0;
	
	$scope.refreshSession = function(){
		console.log("refrescando...");
		chrome.runtime.sendMessage({
			uocrequest : "refresh"
		});
	};
	
	$scope.accesoRapido = function(){
		chrome.runtime.sendMessage({
			uocrequest : "openunread"
		});
	};
	
	$scope.handleTweets = function(tweets){
		var x = tweets.length;
		var n = 0;
		var element = document.getElementById('last-news');
		var html = '<ul>';
		while(n < x) {
			console.log(tweets[n]);
			html += '<li>' + tweets[n] + '</li>';
			n++;
		}
		html += '</ul>';
		element.innerHTML = html;
	};
	
	$log.info("send request")
	chrome.runtime.sendMessage({
		uocrequest : "aulas"
	}, function(response) {
		$scope.$apply(function() {
			$log.info("Aulas obtenidas :");
			$log.info(response)
			$scope.session = response.session
			$scope.aulas = response.aulas
			$scope.unreadmessages = response.unReadMsg
			$scope.personalMailbox=response.personalMailbox
		});
	});
	
});

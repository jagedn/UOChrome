var uocApp = angular.module('uocApp', []);

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

uocApp.controller('UOChromeCtrl', function($scope, $log) {
	$scope.aulas = [];

	chrome.runtime.sendMessage({
		request : "uocsession"
	}, function(response) {
		$scope.$apply(function() {
			$scope.uocsession = response.uocsession;
			$scope.aulas = response.aulas
		});
	});
});
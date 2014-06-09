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
		}, function(response) {		
			$scope.$apply(function() {			
				$scope.session = response.session;
				$scope.aulas = response.aulas;
			});
		});
	};
	
	$scope.accesoRapido = function(){
		chrome.runtime.sendMessage({
			uocrequest : "openunread"
		}, function(response) {		
			
		});
	};
	
	chrome.runtime.sendMessage({
		uocrequest : "session"
	}, function(response) {		
		$scope.$apply(function() {			
			$scope.session = response.session;
		});
	});
	chrome.runtime.sendMessage({
		uocrequest : "aulas"
	}, function(response) {
		$scope.$apply(function() {
			$log.info("aqui");
			$log.info(response);
			$scope.aulas = response.aulas
			$log.info($scope.aulas)
			
			var unread = 0;
			angular.forEach($scope.aulas,function(value,index){
					for(var r in value.resources){
						if(parseInt(value.resources[r].unread))
							unread = unread + parseInt(value.resources[r].unread);
					}
					
					
			})
			
			$scope.unreadmessages = unread;
			
		});
	});
	
	
});


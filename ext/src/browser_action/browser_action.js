
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

	$scope.buzonPersonal = function(){
		chrome.runtime.sendMessage({
			uocrequest : "openBuzonPersonal"
		});
		return false;
	};
	
	$scope.campus = function(){	
		chrome.runtime.sendMessage({
			uocrequest : "openCampus"
		});
		return false;
	}
	
	$scope.openAula = function(aula){
		chrome.runtime.sendMessage({
			uocrequest: "openAula",
			aula : aula
		});
		return false;
	}
	
	$scope.openResource = function(aula, resource){
		chrome.runtime.sendMessage({
			uocrequest: "openResource",
			aula : aula,
			resource : resource
		});
		return false;
	}
	
	$scope.openRac = function(aula, resource){
		chrome.runtime.sendMessage({
			uocrequest: "openRac",
			aula : aula,
			resource : resource
		});
		return false;
	}
	
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

var settings = new Store("settings");
var settings = new Store("settings");
var sessionId=null;
var loginInterval,homePageInterval,checkMinimumReachedInterval ;
var currentAulas;
var unReadMsg=0;
var personalMailbox = {};

function map2string(map){
	var str = "";
	for(var v in map){
		str += v+"="+map[v]+"&";		
	}
	return str;
}

function nowToStr(){
	var time = /(..)(:..)/.exec(new Date());     // The prettyprinted time.
	var hour = time[1] % 12 || 12;               // The prettyprinted hour.
	var period = time[1] < 12 ? 'a.m.' : 'p.m.'; // The period of the day.
	return hour + time[2] + ' ' + period;
}
function getPicture(aula){
	var args = {
		s : sessionId,
		param : 'dCode%3D'+aula.code,
		up_xmlUrlServiceAPI : 'http%253A%252F%252Fcv.uoc.edu%252Fwebapps%252Fclassroom%252Fservlet%252FGroupServlet%253FdtId%253DDOMAIN',
		up_target:'aula.jsp',
		up_dCode: 'aula.code',
		fromCampus:'true',
		lang:'es',
		country:'ES',
		hp_theme:'false'
	}
	$.get('http://cv.uoc.edu/webapps/widgetsUOC/widgetsDominisServlet?'+map2string(args), function(resp) {
		var index = resp.indexOf('<div class="agora identifica');			
		if (index != -1) {
			aula.mc_icon=resp.substring(index+31)
			var tag = aula.mc_icon[aula.mc_icon.indexOf('src')+4]
			aula.mc_icon=aula.mc_icon.substring(aula.mc_icon.indexOf('src')+5)
			aula.mc_icon=aula.mc_icon.substring(0,aula.mc_icon.indexOf(tag))			
			//saveAula(aula)
		}
	});	
}
function doLogin(){
	console.log("enter::doLogin");
	currentAulas=null;
	iconUnread(0);
	if( settings.get("username") == null ||  settings.get("username") == "" ){
		return;
	}
	if( settings.get("password") == null ||  settings.get("password") == "" ){
		return;
	}
	$.ajax({
		type:"POST",
		beforeSend: function (request){
			request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		},
		url: "http://cv.uoc.edu/cgi-bin/uoc",
		data: map2string({
			l:settings.get("username"),
			p:settings.get("password"),
			appid:"WUOC",
			nil:"XXXXXX",
			lb:"a",
			url:"http://cv.uoc.edu",
			x:"13",
			y:"2"			
		}),
		processData: false,
		success: function(resp) {
			var iSs = resp.indexOf("?s=");			
			if( iSs != -1 ){		
				var	iSf = resp.indexOf("\";", iSs);
				sessionId = resp.substring(iSs + 3, iSf);
				onLogin();
			}else{
				onLoginError();
			}
		},
		error: function(){
			onLoginError();
		}
    });
	console.log("exit::doLogin");
}

function onLogin(){
	getHomePage();	
	getPersonalMessages()
}

function getHomePage(){
	var args = {
		s : sessionId,
		newStartingPage:0,
		language:"b"
	}			
	$.get('http://cv.uoc.edu/UOC2000/b/cgi-bin/hola?'+map2string(args), function(resp) {
		var index = resp.indexOf("aulas = ");				
		if (index != -1) {			
			lastPage = resp.substring(index + 8);				
			var last = lastPage.indexOf(";");
			lastPage = lastPage.substring(0,last);					
			var tmp = eval(lastPage);
			var resources = [];
			for(var i in tmp){
				if( tmp[i].title && tmp[i].resources && (tmp[i].domaintypeid=='AULA'||tmp[i].domaintypeid=='TUTORIA')){
					getPicture(tmp[i]);
					resources.push(tmp[i])
				}
			}
			console.log(resources);
			resourcesLoaded( resources )
		}		
		homePageInterval = setTimeout(getHomePage,1000*60);
		checkMinimumReachedInterval = setTimeout(checkMinimumReached,5*1000*60);
	});
}

function onLoginError(){
	loginInterval = setTimeout(doLogin,1000*60*5);
	notifyLoginError();
}

function getPersonalMessages(){
	console.log("Entering getPersonalMessages()");
	
	personalMailbox = {};
	
	$.ajax({
		url: "http://cv.uoc.edu/WebMail/attach.do",
		type: 'get',
    cache:false,
		async:'false',
		data: {s: sessionId},
		success: function(data){
			
			var search = 'totalNewMsgs';
			var index = data.indexOf(search);
			index = data.indexOf(search, index+1);
			var firstIndex = index+search.length;
			var lastIndex = data.indexOf(",", firstIndex);
			var newMsgs = data.substring(firstIndex, lastIndex).replace('\\":', '');
			
			search = 'totalMsgs';
			index = data.indexOf(search);
			index = data.indexOf(search, index+1);
			firstIndex = index+search.length;
			lastIndex = data.indexOf(",", firstIndex);
			
			var totalMsgs = data.substring(firstIndex, lastIndex).replace('\\":', '');
						
			search = 'mailS';
			index = data.indexOf(search);
			index = data.indexOf(search, index+1);
			firstIndex = index+search.length;
			lastIndex = data.indexOf("/>", firstIndex);
			
			var image = data.substring(firstIndex, lastIndex).replace("'", '');
			
			var parts = image.split('|');
			if(parts.length > 1){
				parts = parts[0].split('[');
				if(parts.length > 1){
					image = "http://cv.uoc.edu/UOC2000/mc-icons/fotos/##username##.jpg?s=##session##".replace("##username##", $.trim(parts[1])).replace("##session##", sessionId);
					
				} else {
					image = '';
				}
			} else {
				image = '';
			}
			
			personalMailbox.domaintypeid = 'BUZONPERSONAL';
			personalMailbox.resources = [];
			
			var res = {};
			res.title = 'Buzón Personal';
			res.unread = newMsgs;
			res.numMesPend = newMsgs;
			res.totals = totalMsgs;
			personalMailbox.resources.push(res);
			personalMailbox.mc_icon = image;			
			
			personalBuzonInterval = setTimeout(getPersonalMessages,1000*60*10);
		},
		error: function(){
			console.log("Error obteniendo mensajes personales");
		}
	});

}

function resourcesLoaded( resources ){
	currentAulas = resources;	
	iconUnread(0);	
	unReadMsg=0;
	for(var a in resources){  
		if( ""+settings.get(resources[a].code+"_notificar")!='true' && resources[a].domaintypeid != 'BUZONPERSONAL' ){
			console.log("resourceLoaded:notificar false "+resources[a].code);
			resources[a].notificar = false
			continue;
		}
		var tmpacum=0;
		for(var j in resources[a].resources){						
			resources[a].resources[j].numMesPend |= 0;
			resources[a].resources[j].numMesPend = resources[a].resources[j].numMesPend < 0 ? 0 : resources[a].resources[j].numMesPend 
			unReadMsg += resources[a].resources[j].numMesPend;
			if( resources[a].resources[j].numMesPend ){
				console.log(resources[a].resources[j]);
				tmpacum+=resources[a].resources[j].numMesPend
			}
		}
		resources[a].numMesPend=tmpacum;
	}	
	iconUnread(unReadMsg);
}

function checkMinimumReached(){	
	if( !settings.get("emergentes") ){
		console.log("end:resourcesLoaded no emergentes")
		return;
	}		
	if( settings.get("minimo") >= unReadMsg ){
		notifyMinimumReached(unReadMsg);
	}
	console.log("end:resourcesLoaded")	
}

function doNothingCallback() {
}

function notifyLoginError(){
	var opt = {
			type: "basic",
			title: nowToStr(),
			message: i18n.get("login_error"),
			iconUrl: '/icons/logo_puravida_color.png'
	};
    var notification = chrome.notifications.create('itemAdd',opt,doNothingCallback);
    if(notification ){
      notification.show();
      setTimeout( function(){
		  notification.cancel();
		  notification=null;
	   },1000*3);
    }
	console.log("login error")
}

function iconUnread(unread){
	console.log("iconUnread:"+unread)
	if(unread){
		chrome.browserAction.setIcon({path:"/icons/logomsg.png"});  
		chrome.browserAction.setBadgeText({text:""+unread}); 
	}else{
		chrome.browserAction.setIcon({path:"/icons/logo.png"});  
		chrome.browserAction.setBadgeText({text:""}); 
	}
} 

function notifyMinimumReached(acum){
	if(!acum) return;
	
	var opt = {
			type: "basic",
			title: nowToStr(),
			message: i18n.get("unread") + ":"+acum,
			iconUrl: '/icons/logo_puravida_color.png'
	};
    var notification = chrome.notifications.create('itemAdd',opt,doNothingCallback);
	  if(notification){
    	notification.show();
    	setTimeout( function(){
    		notification.cancel();
    		notification=null;
    	},1000*3);
    }       
}

function hasUnreadMessages(aula){
	var unread = 0;
	for(var r in aula.resources){
		if(parseInt(aula.resources[r].numMesPend))
			unread = unread + parseInt(aula.resources[r].numMesPend);
	}
	return unread;
}

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

function openAula( aula ){
	var newURL = "http://cv.uoc.edu/webapps/classroom/"+aula.pt_template+"/frameset.jsp?domainCode="+aula.code+"&s="+sessionId;
	trackEvent(aula.title);
	chrome.tabs.create({ url: newURL });
}

function openResource(aula, resource){
	var newURL = "http://cv.uoc.edu/cgi-bin/ma_mainMailFS?l="+resource.code+"&s="+sessionId;
	trackEvent(aula.title);
	chrome.tabs.create({ url: newURL });
}

function openRac(aula){
	var newURL = "http://cv.uoc.edu/webapps/rac/listEstudiant.action?domainId="+aula.domainid+"&s="+sessionId;
	trackEvent(aula.title);
	chrome.tabs.create({ url: newURL });
}

function openBuzon(){
	var newURL = "http://cv.uoc.edu/WebMail/attach.do?s="+sessionId;
	trackEvent('buzon');
	chrome.tabs.create({ url: newURL });
}

chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {
	if( request.uocrequest ){
		if( request.uocrequest == "refresh" ){			
			console.log(sessionId)
			doLogin();		
			return true;
		}
		
		if( request.uocrequest == "session" ){			
			sendResponse({session:sessionId});
			return true;
		}
		
		if( request.uocrequest == "aulas" ){
			console.log(currentAulas);
			sendResponse({
				session:sessionId,
				unReadMsg : unReadMsg,
				aulas:currentAulas,
				personalMailbox:personalMailbox
			});
			return true;
		}
		
		if(request.uocrequest == "openunread"){
			for(var a in currentAulas){
				if(hasUnreadMessages(currentAulas[a])){				
						var newURL = '';
						if(currentAulas[a].domaintypeid == "BUZONPERSONAL"){
							openBuzon()
						} else {
							for(var r in currentAulas[a].resources){
								if(parseInt(currentAulas[a].resources[r].numMesPend)){
									openResource(currentAulas[a],currentAulas[a].resources[r])
								}
							}	
						}										
				}
			}
			return true;
		}
		
		if( request.uocrequest === "openBuzonPersonal"){		
			var	newURL ="http://cv.uoc.edu/WebMail/attach.do?s="+sessionId; 
			trackEvent('buzon');
			chrome.tabs.create({ url: newURL });
			return true;
		}
		
		if( request.uocrequest === "openCampus"){		
			var newURL ="http://cv.uoc.edu/cgi-bin/uocapp?s="+sessionId;
			trackEvent('campus');
			chrome.tabs.create({ url: newURL });
			return true;
		}
		
		if( request.uocrequest ==="openAula"){		
			openAula(request.aula)
			return true;
		}
		
		if( request.uocrequest === "openResource"){		
			openResource(request.aula,request.resource)
			return true;
		}
		
		if( request.uocrequest === "openRac"){		
			openRac(request.aula)
			return true;
		}
	}
	return true;
  });

  function startUOChromeBackground(){
	trackEvent('started');	
	// Por ultimo desencadenamos el proceso de login 
	loginInterval = setTimeout(doLogin,10000);
  }
  
chrome.runtime.onStartup.addListener(function() {  
 startUOChromeBackground()
});

chrome.runtime.onInstalled.addListener(function() {  
 startUOChromeBackground()
});

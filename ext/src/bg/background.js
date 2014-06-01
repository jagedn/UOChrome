var settings = new Store("settings");
var sesionId;
var loginInterval,homePageInterval,checkMinimumReachedInterval ;
var currentAulas;
var unReadMsg=0;

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
		}
    });
	console.log("exit::doLogin");
}

function onLogin(){
	getHomePage();
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
			resourcesLoaded(resources)
		}
		chrome.runtime.sendMessage({uocresponse: "refresh"});
		homePageInterval = setTimeout(getHomePage,1000*60);
		checkMinimumReachedInterval = setTimeout(checkMinimumReached,5*1000*60);
	});
}

function onLoginError(){
	loginInterval = setTimeout(doLogin,1000*60*5);
	notifyLoginError();
}

function resourcesLoaded( resources ){
	currentAulas = resources;	
	iconUnread(0);	
	unReadMsg=0;
	for(var a in resources){
		if( !settings.get(resources[a].code+"_notificar") ){
			console.log("resourceLoaded:notificar false "+resources[a].code);
			resources[a].notificar = false
			continue;
		}
		var tmpacum=0;
		for(var j in resources[a].resources){						
			resources[a].resources[j].numMesPend |= 0;
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


loginInterval = setTimeout(doLogin,1000);

function notifyLoginError(){
	console.log("Login error");
	var notification = window.webkitNotifications.createNotification(
		'/icons/logo_puravida_color.png',                      // The image.
		nowToStr(), // The title.
		i18n.get("login_error")      // The body.
	);
	notification.show();
	setTimeout( function(){
		notification.cancel();
		notification=null;
	},1000*3);
}

function iconUnread(unread){
	console.log("iconUnread:"+unread)
	if(unread){
		chrome.browserAction.setIcon({path:"icons/logomsg.png"});  
		chrome.browserAction.setBadgeText({text:""+unread}); 
	}else{
		chrome.browserAction.setIcon({path:"icons/logo.png"});  
		chrome.browserAction.setBadgeText({text:""}); 
	}
} 

function notifyMinimumReached(acum){
	if(!acum) return;
	var notification = window.webkitNotifications.createNotification(
		'/icons/logo_puravida_color.png',                      // The image.
		nowToStr(), // The title.
		i18n.get("unread") + ":"+acum     // The body.
	);
	notification.show();
	setTimeout( function(){
		notification.cancel();
		notification=null;
	},1000*3);
}

chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {
	if( request.uocrequest ){
		if( request.uocrequest == "refresh" ){
			clearTimeout(loginInterval);
			doLogin();		
			sendResponse({session:sessionId});
		}
		if( request.uocrequest == "session" ){
			console.log("uocrequest:session="+sessionId);
			sendResponse({session:sessionId});
		}
		if( request.uocrequest == "aulas" ){
			console.log("uocrequest:aulas=");
			console.log(currentAulas);
			sendResponse({aulas:currentAulas});
		}
	}
  });
	
	
	
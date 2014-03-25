window.addEvent("domready", function () {
    // Option 1: Use the manifest:
	/*
    new FancySettings.initWithManifest(function (settings) {
        settings.manifest.myButton.addEvent("action", function () {
            alert("You clicked me!");
        });
    });
    */
    // Option 2: Do everything manually:

	var store = new Store("settings");
    
    var settings = new FancySettings("UOC Extension", "/icons/logo128.png");
    
    var username = settings.create({
        "tab": i18n.get("information"),
        "group": i18n.get("login"),
        "name": "username",
        "type": "text",
        "label": i18n.get("username"),
        "text": i18n.get("x-characters")
    });
    
    var password = settings.create({
        "tab": i18n.get("information"),
        "group": i18n.get("login"),
        "name": "password",
        "type": "text",
        "label": i18n.get("password"),
        "text": i18n.get("x-characters-pw"),
        "masked": true
    });
    
    var myDescription = settings.create({
        "tab": i18n.get("information"),
        "group": i18n.get("login"),
        "name": "myDescription",
        "type": "description",
        "text": i18n.get("description")
    });
    
	if( store.get("emergentes") == null )
		store.set("emergentes",true)
	var emergentes = settings.create({
        "tab": i18n.get("information"),
        "group": i18n.get("login"),
        "name": "emergentes",
        "type": "checkbox",
        "label": i18n.get("emergentes")
    });
	
	if( store.get("minimo") == null )
		store.set("minimo",1)
	var minimo = settings.create({
        "tab": i18n.get("information"),
        "group": i18n.get("login"),
        "name": "minimo",
        "type": "slider",
        "label": i18n.get("minimo"),
		"max":100, 
		"min":1,
		"step":1
    });
	
	if( store.get("estadisticas") == null )
		store.set("estadisticas",true)	
	var estadisticas = settings.create({
        "tab": i18n.get("information"),
        "group": i18n.get("login"),
        "name": "estadisticas",
        "type": "checkbox",
        "label": i18n.get("estadisticas")
    });
	
	var loginButton = settings.create({
        "tab": i18n.get("information"),
        "group": i18n.get("login"),
        "name": "loginButton",
        "type": "button",        
        "text": i18n.get("login")
    }).addEvent("action", function () {
		chrome.runtime.sendMessage({uocrequest: "refresh"}, function(response) {
			alert(response)
			window.location.reload()
		});			
    });
	
    settings.create({
        "tab": i18n.get("information"),
        "group": "Remove",
        "name": "removeButton",
        "type": "button",        
        "text": i18n.get("remove")
    }).addEvent("action", function () {
        if( confirm(i18n.get("areyousure"))){
			store.removeAll();
			alert("Preferencias eliminadas");
			chrome.runtime.sendMessage({uocrequest: "refresh"});
			window.location.reload()			
		}
    });
	
    settings.create({
        "tab": i18n.get("Aulas"),
        "group": "info",
        "name": "info",
        "type": "description",
        "text": "En este apartado puedes configurar tus aulas actuales"
    });
	
	chrome.runtime.sendMessage({uocrequest: "aulas"}, function(response) {
		if( response.aulas && response.aulas.length){
			for(var a=0; a<response.aulas.length; a++){
				settings.create({
					"tab": i18n.get("Aulas"),
					"group": response.aulas[a].code,
					"name": response.aulas[a].code,
					"type": "description",
					"text": response.aulas[a].title
				});
				if( store.get(response.aulas[a].code+"_notificar") == null )
					store.set(response.aulas[a].code+"_notificar",true)
				settings.create({
					"tab": i18n.get("Aulas"),
					"group": response.aulas[a].code,
					"name": response.aulas[a].code+"_notificar",
					"type": "checkbox",
					"label": i18n.get("notificar")
				});
				if( store.get(response.aulas[a].code+"_emergente") == null )
					store.set(response.aulas[a].code+"_emergente",true)
				settings.create({
					"tab": i18n.get("Aulas"),
					"group": response.aulas[a].code,
					"name": response.aulas[a].code+"_emergente",
					"type": "checkbox",
					"label": i18n.get("mostraremergente")
				});				
			}
			loginButton.element.disabled=true;
		}		
	});			
	
    settings.create({
        "tab": i18n.get("logcambios"),
        "group": "v. 4.0.1",
        "name": "cambio1",
        "type": "description",
        "text": "Refactoring del plugin completo Feb/2014"
    });

    
    settings.align([
        username,
        password
    ]);

	chrome.extension.onMessage.addListener(
	  function(request, sender, sendResponse) {
		if( request.uocresponse ){
			if( request.uocresponse == "refresh" ){
				window.location.reload()
			}
		}			
	});
});

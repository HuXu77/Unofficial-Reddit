function PrefsAssistant() {

}

PrefsAssistant.prototype.setup = function() {
	// setup the username in lower case
	this.controller.setupWidget('user-name',
			{   textReplacement : false,
				modelProperty : "text" });
	this.controller.setupWidget('pass-word');
	
	this.controller.setupWidget("save-button",
		    this.attributes =
		    {
		      type: "affirmative"
		    });
	var Cookie = new Mojo.Model.Cookie('userData');
	
/*	if (Cookie != 'undefined')
	{
		this.controller.get("pass-word").mojo.innerHTML = 
	}*/
	
};

PrefsAssistant.prototype.handleCommand = function(event)
{
  if(event.type == Mojo.Event.back)
  {
	// get the username and password when exiting preferences
    var user = this.controller.get("user-name").mojo.getValue();
	//Mojo.Log.info("User name: " + user);
    user = user.replace(/^\s+|\s+$/g,'');
    var password = this.controller.get("pass-word").mojo.getValue();
    password = password.replace(/^\s+|\s+$/g,'');
	
    this.login(user, password);
  }
}

PrefsAssistant.prototype.activate = function(event) {
	
};

PrefsAssistant.prototype.login = function(user, password)
{
	Mojo.Log.info("Logging in...");
	// attempt to login to Reddit
	var parameters =
	{    
	 user: user,
	 passwd: password,
	 api_type: 'json'
	};
	var op = "http://www.reddit.com/api/login/" + user;
	this.login_request = new Ajax.Request(op,
	                    {
	                      method: 'post',
	                      parameters: parameters,
	                      onSuccess: this.login_response.bind(this),
	                      onFailure: this.fail_response.bind(this),
	                      //onException: this.exception.bind(this),
	                      onInteractive: this.login_response.bind(this)
	                    });  

};

PrefsAssistant.prototype.login_response = function(response)
{
	//Mojo.Log.info("Login success");
	if(response.readyState == 4 && response.status == 200)
	  {
	    var jsontext = eval('(' + response.responseText + ')');
	    var json = jsontext.json;
	    if (typeof(json.data) == 'undefined') {
			this.controller.showAlertDialog({
				onChoose: function(value){
					this.controller.stageController.pushScene("prefs");
				},
				preventCancel: true,
				title: $L("Error"),
				message: $L("Invalid user id/password"),
				choices: [{
					label: $L("Close"),
					value: "close"
				}]
			});
			return;
		}
		else {
			var Cookie = new Mojo.Model.Cookie('userData');
			Cookie.put(json.data);
			//var co = Cookie.get();
			//Mojo.Log.info("Login response: " + response.responseText);
			//Mojo.Log.info("Modhash "+ co.modhash);
			//this.controller.stageController.pushScene("page");
		}
	  }
};

PrefsAssistant.prototype.fail_response = function(event) {
	Mojo.Log.info("Login failed...");
	this.controller.showAlertDialog({
				preventCancel: true,
				title: $L("Error"),
				message: $L("Unable to login to Reddit. Try again later."),
				choices: [{
					label: $L("Close"),
					value: "close"
				}]
			});
}

PrefsAssistant.prototype.deactivate = function(event) {

};

PrefsAssistant.prototype.cleanup = function(event) {
	
};

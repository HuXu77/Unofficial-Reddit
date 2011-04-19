function ArticleAssistant(url, title, comments) {
	this.url = url;
	this.title = title;
	this.comments = comments;
}

ArticleAssistant.prototype.setup = function() {
	this.controller.get('main-title').innerHTML = this.title
	
	// builds the webview
	this.controller.setupWidget('myWebView', {'url': this.url}, {});  
	
	// builds the commandMenu
	this.cmdMenuModel = {
    visible: true,
    items: [{items:[{label: $L('Upv'), command:'upvote'},{label: $L('Downv'), command:'downvote'}]},
        {items:[{label: $L('Comments'), command:'comments'}]}
    	]
	};
 
	this.controller.setupWidget(Mojo.Menu.commandMenu, undefined, this.cmdMenuModel);
};

ArticleAssistant.prototype.handleCommand = function(event) {
	Mojo.Log.info("Command: "+event.command);
    if (event.type === Mojo.Event.command) {
        switch (event.command) {
            case "comments": Mojo.Controller.stageController.pushScene("comments", this.comments, this.title);
			break;
        }
    }
};

ArticleAssistant.prototype.activate = function(event) {
	// Mojo.Log.info("Comments: "+this.comments);
};

ArticleAssistant.prototype.deactivate = function(event) {
	
};

ArticleAssistant.prototype.cleanup = function(event) {
	
};

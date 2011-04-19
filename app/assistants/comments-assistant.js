function CommentsAssistant(url, title) {
	// this determines the difference between permalink and url
	// aka the difference between coming from webview or from page scene
	if (url.truncate(7) == "http...")
		this.url = url+".json";
	else
		this.url = "http://www.reddit.com"+url+".json";
	this.title = title;
	this.reply_scopes = [];
	this.newData = [];
	this.forNew = 1;
	this.html = "";

};

CommentsAssistant.prototype.setup = function() {
	this.controller.get('comments-title').innerHTML = this.title
	
	// create the loading spinner
	this.controller.setupWidget("loading_divSpinner", { spinnerSize : "small" }, { spinning: true } );
	
	// build an empty array to be filled with whatever later
	//this.commentsListModel = { items : [] };  
    // set the itemTemplate and limit number of items shown, here its 20
  	//this.commentsListAttr = {  
    //	itemTemplate: "comments/commentsTemplate",  
	//};
    
	// setup the list
	//this.controller.setupWidget("commentsList",null,this.commentsListModel);
	// need the bind to be in this.handleTap so it can be properly deactivated
	//this.handleTap = this.handleTap.bindAsEventListener(this);
};

CommentsAssistant.prototype.activate = function(event) {
	//Mojo.Log.info("I error after the data");
	this.getData();
	
	//Mojo.Event.listen(this.controller.get('commentsList'),Mojo.Event.listTap, this.handleTap);
};

CommentsAssistant.prototype.buttonSetup = function(item, s){
	this.controller.listen(item, Mojo.Event.tap, this.toggleDrawerByTarget.bindAsEventListener(this));
};

CommentsAssistant.prototype.drawerWidgetSetup = function(item, s){
	// this gives the drawer an id, not sure what the s is
	//Mojo.Log.info("This is s " + s);
	item.writeAttribute('id','drawer'+s);
	var id = item.getAttribute('id');
	//Mojo.Log.info("This is id " + id);
	this.controller.setupWidget(id, {
		modelProperty: 'openz'
	});
	//this.controller.get(id).mojo.setOpenState(true);
};

CommentsAssistant.prototype.toggleDrawerByTarget = function(event){
	var targetRow = this.conroller.get(event.target);
	var drawer = targetRow.up('div.palm-row').next('div.drawer');
	Mojo.Log.info("drawer: " + drawer.mojo.getOpenState());
	//$(this.controller.get(drawer)).mojo.setOpenState(!this.controller.get(drawer).mojo.getOpenState());

}

CommentsAssistant.prototype.handleTap = function(event) {

	var target = $(event.originalEvent.target);
	// these vars are key to checking if up or down vote has already been selected
	var theNex = $(event.originalEvent.target).next(1);
	var thePre = $(event.originalEvent.target).previous(1);
	// event.originalEvent.target = class of id
	// event.originalEvent.target.id = id
	
	// right now we are using the classes to be able to toggle the up and down votes
	if (target.hasClassName('upvoteSel')) {
		target.removeClassName('upvoteSel');
		target.addClassName('upvoteO');
	}
	else if (target.hasClassName('upvoteO') && $(theNex).hasClassName('downvoteO')) {
		//Mojo.Log.info("This is what? " + this.controller.get('downvote').className);
		target.removeClassName('upvoteO');
		target.addClassName('upvoteSel');
	}
	if (target.hasClassName('downvoteSel')) {
		target.removeClassName('downvoteSel');
		target.addClassName('downvoteO')
	}
	else if (target.hasClassName('downvoteO') && $(thePre).hasClassName('upvoteO')){
		target.removeClassName('downvoteO');
		target.addClassName('downvoteSel');
	}
	// if we click the actual article then push the article scene
	if (target.id == ""){
		// show reply button and view profile button
	}  
};

CommentsAssistant.prototype.getData = function () {
	
	this.controller.get('loading_divScrim').style.visibility = "visible";
	$("loading_divSpinner").show();
	
	//Mojo.Log.info("The URL: "+this.url);
	
	// use Ajax to grab the data and store it in request
	var request = new Ajax.Request(this.url, {  
        method: 'get',  
        asynchronous: true,  
        evalJSON: "false",  
        onSuccess: this.parseResult.bind(this),  
  
    on0: function (ajaxResponse) {  
            // connection failed, typically because the server is overloaded or has gone down since the page loaded  
            Mojo.Log.error("Connection failed");  
            },  
    onFailure: function(response) {  
            // Request failed (404, that sort of thing)  
            Mojo.Log.error("Request failed");  
            },  
    onException: function(request, ex) {  
            // An exception was thrown  
            Mojo.Log.error("Exception");  
    }  
	});

};

CommentsAssistant.prototype.parseResult = function (transport){
	// this will be the new array that actually has stuff, because the first one was empty  
  
    // grabbing the text stream from the transport
	var theStuff=transport.responseText;  
  
    // the stream must be in json format for this to work
	try {  
		var json = theStuff.evalJSON();  
  	}  
    catch(e) {  
    	Mojo.Log.error(e);  
  	} 
    
    this.html = '<div class="palm-row drawer-button" id="button1">';
	// gets the length of the children array which is the 2nd part of the json array
	// the first part is the submission
	// if its just text then body is selftext
	if (json[0].data.children[0].data.is_self == true && json[0].data.children[0].data.selftext != "") {
		this.html += this.buildTemplate(json[0].data.children[0].data, json[0].data.children[0].data.selftext);
		/*this.newData[0] = {
			body: json[0].data.children[0].data.selftext,
			totCount: json[0].data.children[0].data.score,
			author: json[0].data.children[0].data.author
		};*/
	}
	else if (json[0].data.children[0].data.is_self == true && json[0].data.children[0].data.selftext == ""){
		this.html += this.buildTemplate(json[0].data.children[0].data, json[0].data.children[0].data.title);
		/*this.newData[0] = {
				body: json[0].data.children[0].data.title,
				totCount: json[0].data.children[0].data.score,
				author: json[0].data.children[0].data.author
			};*/
	}
	// or if its a picture then give the thumbnail
	else if (json[0].data.children[0].data.is_self == false && json[0].data.children[0].data.thumbnail != "") {
		this.html += this.buildTemplate(json[0].data.children[0].data, json[0].data.children[0].data.title);
		//Mojo.Log.info("I should show UP ***************");
		/*this.newData[0] = {
			body: json[0].data.children[0].data.title,
			totCount: json[0].data.children[0].data.score,
			author: json[0].data.children[0].data.author,
			thumbnail: json[0].data.children[0].data.thumbnail
		};*/
	}
	// or if is some other link then don't include thumbnail
	else if (json[0].data.children[0].data.is_self == false) {
		this.html += this.buildTemplate(json[0].data.children[0].data, json[0].data.children[0].data.title);
		/*this.newData[0] = {
				body: json[0].data.children[0].data.title,
				totCount: json[0].data.children[0].data.score,
				author: json[0].data.children[0].data.author,
			};*/
		}
	else
		Mojo.Log.error("Error at is_self");	
	
	// build the comments data and return the array for the list
	//Mojo.Log.info("About to start build comments for the first time");
	this.html += '<div class="drawer" x-mojo-element="Drawer">';
	this.buildComments(json[1].data.children);
	this.html += '</div>';
	Mojo.Log.info("Build list success");
    // fill the empty object array with the for loop object array
  	//this.commentsListModel["items"] = this.newData;  
    // load the list
    //this.controller.modelChanged(this.commentsListModel, this); 
	$('listWrapper').innerHTML = this.html;
	// now we will need to search and remove all empty img's
	var thumbys = document.getElementsByName('thumby');
	//Mojo.Log.info("The Thumby"+thread.data.thumbnail);
	// this is for the main content while the for is for comments
	if (json[0].data.children[0].data.is_self == true || json[0].data.children[0].data.thumbnail == "") {
  		for (j=0;j<thumbys.length;j++){
			thumbys[j].hide();
  		}
	}
	else {
  		for (j=1;j<thumbys.length;j++){
			thumbys[j].hide();
  		}
	}
	//Mojo.Log.info("This.html: " + this.html);
	
	$$('div.drawer-button').each(this.buttonSetup.bind(this));
	Mojo.Log.info("Button bind success");
	$$('div.drawer').each(this.drawerWidgetSetup.bind(this));
	Mojo.Log.info("Widget setup success"); 
	$$('div.drawer').each(function(item){
		Mojo.Log.info("Understand objects "+item);
		item.mojo.setOpenState(true);
	});

  	this.controller.get('loading_divScrim').style.visibility = "hidden"; 
  	$("loading_divSpinner").hide();
}; 

CommentsAssistant.prototype.buildTemplate = function (data, body){
	var votes = data.ups - data.downs;
	var retHTML = '<div class="palm-row-wrapper"><div class="titlemod"><div class="comVoting"><div id="upvote" class="upvoteO"></div>'+
		'<div id="count" class="count">'+votes+'</div>'+	
		'<div id="downvote" class="downvoteO"></div></div><div id="body" name="body" class="bulk">'+
	 	'<img src='+data.thumbnail+' id="thumby" name="thumby">'+body+
		'<div class="authr">'+data.author+'</div></div></div></div></div>';
		// the last div will end the row div
	
	return retHTML;
};

CommentsAssistant.prototype.buildComments = function (comments){
	var i = 0;
	//Mojo.Log.info("Oops I recursioned again! Author: "+comments[0].data.name);
	while (i<comments.length)
	{
		// if the kind is more, forget it
		if (comments[i].kind != "more")
		{
			// if there are replies, we need to recurse through them
			if (comments[i].data.replies != "")
			{
				//Mojo.Log.info("I am a parent " + comments[i].data.author + "at index i " + i);
				this.html += '<div class="palm-row drawer-button">'+
				this.buildTemplate(comments[i].data, comments[i].data.body)+
				'<div class="drawer" x-mojo-element="Drawer">';
				this.buildComments(comments[i].data.replies.data.children);
				this.html += "</div>";
				i++;
			}
			else // if there aren't any replies
			{
				//Mojo.Log.info("I am a child "+comments[i].data.author);
				if (i == comments.length - 1) {
					this.html += '<div class="palm-row last">' +
					this.buildTemplate(comments[i].data, comments[i].data.body);
				}
				else
				{
					this.html += '<div class="palm-row">' +
					this.buildTemplate(comments[i].data, comments[i].data.body);
				}
				// if there are no replies we just need a drawer with a row
				// document.innerHTML = <div class="drawer" x-mojo-element="Drawer">
								//<div class="palm-row">
				/*this.newData[this.forNew] = {
					body: comments[i].data.body,
					totCount: comments[i].data.ups - comments[i].data.downs,
					author: comments[i].data.author
				};*/
				i++;
				//this.forNew++;
			}
		}
		else
			i++;
	}
};

CommentsAssistant.prototype.deactivate = function(event) {
	//Mojo.Event.stopListening(this.controller.get('commentsList'),Mojo.Event.listTap, this.handleTap);
};

CommentsAssistant.prototype.cleanup = function(event) {
	
};

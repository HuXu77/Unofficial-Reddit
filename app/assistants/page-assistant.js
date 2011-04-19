function PageAssistant() {
};

PageAssistant.prototype.setup = function() {
	this.subred = "frontpage";
	this.url = "";
	this.vh;
	
	// setup the appMenu
	this.controller.setupWidget(Mojo.Menu.appMenu,
    this.attributes = {
        omitDefaultItems: true
    },
	
	// setup the preferences menu
    this.model = {
        visible: true,
        items: [ 
            { label: "Settings", command: 'prefs' },
            { label: "Help", command: 'help' }
        ]
    });
	
	// create the loading spinner
	this.controller.setupWidget("loading_divSpinner", { spinnerSize : "small" }, { spinning: true } );
	
	// build the header scroller widget
	this.controller.setupWidget("scrollerId", {
                 mode: 'horizontal-snap'
               }, this.scrollerModel = {
			   		// snapIndex determines the place it snaps to
			   		snapIndex: 0,
			   		snapElements: {x: [], y: []}
               }
        );
	// default scroller menu	
	this.subredMenu = { stuff : [ {title: 'frontpage'}, {title: 'pics'}, {title: 'funny'}, {title: 'politics'}, {title: 'askReddit'}, {title: 'wtf'}, {title: 'gaming'} ] };
	// listen on the header
    this.controller.listen("scrollerId", Mojo.Event.scrollStarting, this.handleUpdate.bindAsEventListener(this));
	
	// build an empty array to be filled with whatever later
	this.mainListModel = { items : [] };  
    // set the itemTemplate and limit number of items shown, here its 20
  	this.mainListAttr = {  
    	itemTemplate: "page/itemTemplate",  
    	renderLimit: 25,
	};
    
	this.Cookie = new Mojo.Model.Cookie('userData');
	
	if (this.Cookie == 'undefined') {
		this.loggedIn = false;
	}
	else {
		this.loggedIn = true;
		//Mojo.Log.info("I can tell you are logged in with ");
	}
	// setup the list
	this.controller.setupWidget("mainList",this.mainListAttr,this.mainListModel);
	// need the bind to be in this.handleTap so it can be properly deactivated
	this.handleTap = this.handleTap.bindAsEventListener(this);  
};

PageAssistant.prototype.activate = function(event) {
	this.buildMenu();
	// call the function getData to get the json stuff
	this.getData();
	
	Mojo.Event.listen(this.controller.get('mainList'),Mojo.Event.listTap, this.handleTap);
};

PageAssistant.prototype.fixArrows = function() {
	// grab our article div's
	var setArrows = document.getElementsByName('article');
	var userLikes;
	var vote;
	
	//Mojo.Log.info("setArrows: " + setArrows.length);
	// find which arrows need to be marked up or down
	for (i=0; i < setArrows.length; i++)
	{
		userLikes = setArrows[i].down('div.like').innerHTML;
		//Mojo.Log.info("Article name: " + setArrows[i].down('div.titl').innerHTML);
		//Mojo.Log.info("userLikes: " + userLikes);
		// if the user likes this article
		if (userLikes == "true")
		{
			vote = setArrows[i].down('div.upvoteO');
			vote.removeClassName('upvoteO');
			vote.addClassName('upvoteSel');
		}
		else if (userLikes == "false")
		{
			vote = setArrows[i].down('div.downvoteO');
			vote.removeClassName('downvoteO');
			vote.addClassName('downvoteSel');
		}
		else
		{
			
		}
	}
};

// this handles the selection thats clicked on the list
PageAssistant.prototype.handleTap = function(event) {

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
		this.vote(event.item, 0);
	}
	else if (target.hasClassName('upvoteO') && $(theNex).hasClassName('downvoteO')) {
		//Mojo.Log.info("This is what? " + this.controller.get('downvote').className);
		target.removeClassName('upvoteO');
		target.addClassName('upvoteSel');
		this.vote(event.item, 1);
	}
	if (target.hasClassName('downvoteSel')) {
		target.removeClassName('downvoteSel');
		target.addClassName('downvoteO')
		this.vote(event.item, 0);
	}
	else if (target.hasClassName('downvoteO') && $(thePre).hasClassName('upvoteO')){
		target.removeClassName('downvoteO');
		target.addClassName('downvoteSel');
		this.vote(event.item, -1);
	}
	// if we click the actual article then push the article scene
	if (target.id == ""){
		// if its a self link then just go straight to the comments
		//Mojo.Log.info("The domain: "+event.item.domain);
		if (event.item.self == true) 
			Mojo.Controller.stageController.pushScene("comments", event.item.url, event.item.title);
		// otherwise we will be loading an external link
		else {
		if (event.item.domain != "youtube.com")
			Mojo.Controller.stageController.pushScene("article", event.item.url, event.item.title, event.item.comments);
		else {
			// never found the documentation on this but playing with method launch and open and
			// switching around the "" and the '' and finally what you see below works great
			this.controller.serviceRequest('palm://com.palm.applicationManager', {
    			method:'launch',
    			parameters: {
      				id: 'com.palm.app.youtube',
      				params: {"target": event.item.url, "direct": true}
  				}
			});
			Mojo.Controller.stageController.pushScene("comments", event.item.comments, event.item.title)
		}
		}
	}  
};

PageAssistant.prototype.vote = function(item, num)
{
	Mojo.Log.info("This is item: " + item.subreddit);
	var co = this.Cookie.get();
	var parameters =
  	{
    	id: item.id,
    	dir: num,
		uh: co.modhash,
		r: item.subreddit
  	};
	Mojo.Log.info("Thing ID: " + item.id + " subreddit: " + item.subreddit);
  	var op = "http://www.reddit.com/api/vote";  
  	this.vote_request = new Ajax.Request(op,
    			{
                   method: 'post',
                   parameters: parameters,
                   onSuccess: this.vote_success_response.bind(this),
                   onFailure: this.fail_response.bind(this),
                   //onException: this.xmlhttp_exception.bind(this),
                   onInteractive: this.vote_success_response.bind(this)
                });
};

PageAssistant.prototype.vote_success_response = function(event)
{
	
	Mojo.Log.info("Successful vote! " + event.responseText);
	// on success show that the number increases
};

PageAssistant.prototype.fail_response = function(event)
{
	Mojo.Log.info("Vote Failed");
}

PageAssistant.prototype.handleCommand = function(event) {
    if (event.type == Mojo.Event.command) {
        switch (event.command) {
            case "prefs": Mojo.Controller.stageController.pushScene("prefs");
        }
    }
};

// this is for the header scroller HUGE thanks to
// http://almaer.com/blog/
PageAssistant.prototype.buildMenu = function() {
	var html = "";
	// go through each menu item and create the html for it
	for (i=0;i<this.subredMenu.stuff.length;i++)
	{
		// this is to add the items to the scroll menu
		html += "<div class='scrollerItem' id='scrollerItem'>"+this.subredMenu.stuff[i].title+"</div>";
	}
	// this adds the items
	this.controller.get("scrollerContainer").innerHTML = html;
	
	// this sets up the scrollContainer to be the right size to hold all the items
	this.controller.get("scrollerContainer").setStyle({width: 190*this.subredMenu.stuff.length+"px"});
	
	// this sets up the snapElements and refreshes the menu
	this.scrollerModel.snapElements.x = this.controller.select('.scrollerItem');
	this.controller.modelChanged(this.scrollerModel);
};

PageAssistant.prototype.handleMoved = function(done, position) {
        if (done) {
			var stuff = Object.toJSON(position);
			var evaStu = stuff.evalJSON();
			//Mojo.Log.info("Done: ", done, "Position: ", evaStu.x);
			if (evaStu.x != 0) {
				// this is specific to the sizes I have for each item
				// it finds the index in which the title is stored
				divider = (evaStu.x / 190)*-1;
				/// Mojo.Log.info("divider: "+divider);
				this.subred = this.subredMenu.stuff[divider].title;
			}
			else {
				this.subred = this.subredMenu.stuff[0].title;
			}			
			this.getData();
		}
    },
// also for the header scroller
PageAssistant.prototype.handleUpdate = function(event) {
        event.addListener({   
				// bind(this) makes this.getData() work in the move                                               
                moved: this.handleMoved.bind(this)                        
        });
    };


PageAssistant.prototype.getData = function () {
	
	this.controller.get('loading_divScrim').style.visibility = "visible";
	$("loading_divSpinner").show();
	
	//Mojo.Log.info("We got to getData but subred is: "+this.subred);
	// grab json data
	if (this.subred == "frontpage") {
		this.url = "http://www.reddit.com/.json";
	}
	else 
		this.url = "http://www.reddit.com/r/"+this.subred+"/.json";
	
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
    },  
	});

};

PageAssistant.prototype.parseResult = function (transport){
	// this will be the new array that actually has stuff, because the first one was empty
	var newData = [];  
  
    // grabbing the text stream from the transport
	var theStuff = transport.responseText;  
	//Mojo.Log.info("User hash: " + transport);
  
    // the stream must be in json format for this to work
	try {  
		var json = theStuff.evalJSON();  
  	}  
    catch(e) {  
    	Mojo.Log.error(e);  
  	} 
	
	this.vh = json.data.modhash;
	var k = 0;
	var l = json.data.children.length;
	
	// while we haven't reached the number of posts, grab them chil'ren's!
	for (j=0;j<l;j++) {  
   
		var thread=json.data.children[j];

		/// Mojo.Log.info("title:"+thread.data.author);
		// store data into the temporary object array
		if (!this.loggedIn)
      	newData[j] = {
			title: thread.data.title,
			totCount: thread.data.score,
			author: thread.data.author,
			subreddit: thread.data.subreddit,
			thumbnail: thread.data.thumbnail,
			url: thread.data.url,
			comments: thread.data.permalink,
			self: thread.data.is_self,
			domain: thread.data.domain,
			likes: thread.data.is_self
		};
		
		if (this.loggedIn)
		{
			//Mojo.Log.info("Likes: ? " + thread.data.likes)
			newData[j] = {
				title: thread.data.title,
				totCount: thread.data.score,
				author: thread.data.author,
				subreddit: thread.data.subreddit,
				thumbnail: thread.data.thumbnail,
				url: thread.data.url,
				comments: thread.data.permalink,
				self: thread.data.is_self,
				domain: thread.data.domain,
				id: thread.data.name,
				likes: thread.data.likes
			};
		}
		
  	}
  // fill the empty object array with the for loop object array
  	this.mainListModel["items"] = newData;  
  // load the list
    this.controller.modelChanged(this.mainListModel, this); 
	
	//Mojo.Log.info("Num of items: " + document.getElementsByName('thumby')[0].src.truncate(7));
	// this is how I remove empty thumbnails.  document.getEBN gets the array of elements by 
	// the specified name, which for this its every img in the list whether blank or not.
	// then I grab the source, check if its a http or not and if not then hide it.
	//Mojo.Log.info("I am about to remove thumbies");
	var thumbys = document.getElementsByName('thumby');
  	for (j=0;j<thumbys.length;j++){
		if (thumbys[j].src.truncate(7) == "file..."){
			thumbys[j].hide();
		}
  	}
	
	// if logged in, fix the arrows to reflect correct
	if (this.loggedIn) {
		this.fixArrows();
	}	
  	  
  this.controller.get('loading_divScrim').style.visibility = "hidden"; 
  $("loading_divSpinner").hide();
}; 

PageAssistant.prototype.deactivate = function(event) {
	Mojo.Event.stopListening(this.controller.get('mainList'),Mojo.Event.listTap, this.handleTap);
};

PageAssistant.prototype.cleanup = function(event) {
};

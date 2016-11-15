/*                                                                   */
/* Licensed Materials - Property of IBM                              */
/*                                                                   */
/* (C) Copyright IBM Corp. 2001, 2014. All Rights Reserved.          */
/*                                                                   */
/* US Government Users Restricted Rights - Use, duplication or       */
/* ***************************************************************** */
/* disclosure restricted by GSA ADP Schedule Contract with IBM Corp. */
/*                                                                   */
/* ***************************************************************** */

define([
    "dijit/_TemplatedMixin",
	"dijit/_Widget",	
	"dijit/_WidgetsInTemplateMixin",
	"dojo/_base/array",
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/dom",
	"dojo/dom-class", 
	"dojo/dom-construct",
	"dojo/dom-style",
	"dojo/request",
	"dojo/topic",
	"dojo/i18n!./nls/trending_view",
	"dojo/text!./templates/TrendingView.html",
	],
	function (_TemplatedMixin, _Widget, _WidgetsInTemplateMixin, array, declare,
			  lang, dom, domClass, domConstruct, domStyle, request, topic, i18n, template) {
		return declare("agentwatson.TrendingView", [_Widget, dijit._TemplatedMixin, dijit._WidgetsInTemplateMixin], {
			
		/**
		 * The widget base class
		 *
		 * @constant
		 * @type Object
		 * @private
		 */
		baseClass : "trending-view",	
		
		
		/**
		 * The nls bundles for the widget.
		 *
		 * @constant
		 * @type Object
		 * @private
		 */
		_i18n : i18n,
					
		
		templateString:template,
		
		
		/**
		 * The url of the api that returns the list of items to load in the trending view.
		 * @type String
		 */
		targetURL: "",
		
		/**
		 * Array containing the items to display in the trending view table. Each item is a json object that contains
		 * a title, value, target, and trend
		 */
		items: undefined,
		
		/**
		 * Number of rows in the table
		 * @private
		 * @type number
		 */
		rowAmt:0,
		
		constructor: function(/*Object*/args) {
			// Do a safe mixin such that any arguments provided are passed to "this"
			declare.safeMixin(this, args);
			
			if(args.reportName) {
				this._i18n.headerTransactions = args.reportName;
			}

			this._fetch();
		},

		_fetch: function() {			
			
			if(this.msgLoading) {
				domStyle.set(this.msgLoading, "display", "block");
			}
			
			// See if a preference manager id was provided. If so do a lookup and then load mail related preferences.
			if((typeof this.targetURL == "undefined" || this.targetURL == null || lang.trim(this.targetURL).length == 0) && !this.items){
				console.warn(this._i18n.missingReportData);
			}else if(this.targetURL && !this.items){
				var xhrArgs = {
						url : this.targetURL,
						handleAs: "json",
						load: lang.hitch(this,function(data) {
							this.items = data.items;
						}),
						error: lang.hitch(this,function(error) {
							console.error(this._i18n.errorLoadingData + ". Error:" + error);
						})
				}
				
				// Store the deferred object . 
				this.deferred = dojo.xhrGet(xhrArgs);
				
			}
		},
		
		postMixInProperties : function() {
			this.inherited(arguments);
		},

		postCreate : function() {
			this.inherited(arguments);
			
			// Build the widget
			if(this.items) {
				this._populateTable();
			} else if(this.deferred){
				this.deferred.then(lang.hitch(this,function(){
					this._populateTable();
				}),lang.hitch(this,function(err){
				    // listen for errors.
					domClass.remove(this.msgLoading, "loading");
				    this.msgLoading.innerHTML = this._i18n.errorLoadingData;
				  }));
			}			
		},
		
		_populateTable: function() {			
			this.reset(); // reset things again prior to populating the table
			this.rowAmt = 0;
			// Add it to the dom			
			array.forEach(this.items, function(item, i) {
				var c, r;
				// Insert a new row at the top of the table
				r = this.listNode.insertRow(-1); // inserts at the last position					

				// Add the title to the row
				c = r.insertCell(-1);
				domClass.add(c, "report-name");
				// Check if there is a url field and if so then add a hyperlink to the title
				if(item.url) {
					domConstruct.create("a", {href:item.url, title:item.title, innerHTML:item.title, target: "_blank"}, c);
				} else {
					c.innerHTML = item.title; 
				}				

				// Add the value 
				/*c = r.insertCell(-1);
				domClass.add(c, "report-value");
				c.innerHTML = item.value;
				
				
				// Add the target
				c = r.insertCell(-1);
				domClass.add(c, "report-target");
				c.innerHTML = item.target;
				
				
				// Add the trend
				c = r.insertCell(-1);
				domClass.add(c, "report-trend");
				c.innerHTML = item.trend;
				*/

				// Add columns for all/hw/sw
				if(item.data && item.data.length > 0) {
					// first sort objects based on index
					var sortedArray = item.data.sort(function(a,b){
						if(a.index && b.index) {
							return a.index-b.index;
						}
						return 0;
					});
					array.forEach(sortedArray, lang.hitch(this,function(columnEntry, j) {
						c = r.insertCell(-1);
						domClass.add(c, "report-value");
						c.innerHTML = columnEntry.value;
						
						// If this.rowAmt ===0 then add header too for these columns
						if(this.rowAmt === 0) {
							var header = this.viewHeader;
						   // var row = header.insertRow(j+1);
						    var cell = header.rows[0].insertCell(j+1);
						    cell.innerHTML = columnEntry.title;
						}
					}));
					
					
					
				}
				this.rowAmt++;

			}, this);
			
			domStyle.set(this.msgLoading, "display", "none");
		},
		
		startup: function() {
			// Do any startups needed once dom is created for widget
			this.inherited(arguments);
						
		},
		
		reset: function(){
			// summary:
			//		Clears all rows of items. 

			for(var i=0;i<this.rowAmt;i++){
				this.listNode.deleteRow(0);
			}
			this.rowAmt = 0;
			
			// If there are any headed defined remove those too
			if(this.viewHeader && this.viewHeader.rows[0] && this.viewHeader.rows[0].cells ) {
				for(var j = 1; j < this.viewHeader.rows[0].cells.length; j++) {
					console.log("deleting");
					this.viewHeader.rows[0].deleteCell(j);
				}
			}
		},
		
		/**
		 * Reloads the widget with new data fetched.
		 */
		reload: function() {
			this.reset();
			this.items = undefined;
			this._fetch();
			// Build the widget
			if(this.items) {
				this._populateTable();
			} else {
				this.deferred.then(lang.hitch(this,function(){
					this._populateTable();
				}),lang.hitch(this,function(err){				    
				    domClass.remove(this.msgLoading, "loading");
				    this.msgLoading.innerHTML = this._i18n.errorLoadingData;
				  }));
			}	
		}
	});
});
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
	"dojo/_base/declare",
	"dijit/_Widget",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dojo/text!./templates/WatsonAnswersTemplate.html",
	"dojo/_base/lang",
	"dojo/dom-form",
	"dojo/dom-class", 
	"dojo/dom-style",
	"dojo/topic",
	"dojo/request",
	"dojox/grid/EnhancedGrid",
	"dojox/grid/enhanced/plugins/Pagination",
	"dojo/data/ItemFileWriteStore",
	"scripts/constants/Constants",
	"scripts/constants/PubSubTopics",
	],
	function (declare, _Widget, _TemplatedMixin, _WidgetsInTemplateMixin, template,
			  lang, domForm, domClass, domStyle, topic, request,
			  EnhancedGrid, Pagination, ItemFileWriteStore, Constants, PubSubTopics) {
		return declare("agentwatson.WatsonAnswers", [_Widget, _TemplatedMixin, _WidgetsInTemplateMixin], {
		
		templateString: template,
		
		constructor:function(args) {
			lang.mixin(this, args);
		},
		
		postCreate:function() {
			topic.subscribe(PubSubTopics.TICKET_DIALOG_SHOW_WATSON_ANSWERS, lang.hitch(this, "showWatsonAnswers"));
		},
		
		showWatsonAnswers:function() {
			//domStyle.set(this.contentAttachPoint, "height", (this.dialogHeight - 150) + "px");
			//domStyle.set(this.contentAttachPoint, "border", "1px solid rgb(0, 0, 0)");
			var gdata = {
				identifier: 'id',
				items: []
			}
			
			gdata.items.push({
				id: 1,
				answer: "Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante.",
				score: "25.78"
			});
			gdata.items.push({
				id: 2,
				answer: "Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo. Quisque sit amet est et sapien ullamcorper pharetra.",
				score: "13.11"
			});
			gdata.items.push({
				id: 3,
				answer: "Vestibulum erat wisi, condimentum sed, commodo vitae, ornare sit amet, wisi. Aenean fermentum, elit eget tincidunt condimentum, eros ipsum rutrum orci, sagittis tempus lacus enim ac dui.",
				score: "6.54"
			});
			
			var store = new ItemFileWriteStore({data: gdata});
			
			var layout = [[
				{'name': 'Answer', 'field': 'answer', 'width': '80%', noresize: true},
				{'name': 'Score', 'field': 'score', 'width': '20%', noresize: true},
			]];
			
			var gridAnswers = new dojox.grid.EnhancedGrid({
				id: 'gridAnswers',
				store: store,
				structure: layout,
				rowSelector: '20px',
				autoHeight: true
			}, document.createElement('div'));
			
			dojo.byId("gridAnswersDiv").appendChild(gridAnswers.domNode);
			
			gridAnswers.startup();
		},
		
	});
});
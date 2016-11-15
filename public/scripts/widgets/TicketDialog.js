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
	"dojo/text!./templates/TicketDialogTemplate.html",
	"dojo/_base/lang",
	"dojo/dom",
	"dojo/dom-form",
	"dojo/dom-class", 
	"dojo/dom-style",
	"dojo/topic",
	"dojo/request",
	"dojox/mobile/View",
	"scripts/constants/Constants",
	"scripts/constants/PubSubTopics",
	
	"dojo/domReady!"
	],
	function (declare, _Widget, _TemplatedMixin, _WidgetsInTemplateMixin, template,
			  lang, dom, domForm, domClass, domStyle, topic, request, View,
			  Constants, PubSubTopics) {
		return declare("agentwatsontest.TicketDialog", [_Widget, _TemplatedMixin, _WidgetsInTemplateMixin], {
		
		templateString: template,
		
		headerHeight: 50,
		//marginsHeight: 40,
		marginsHeight: 10,
		ratingHelpHeight: 36,
		submitRatingHeight: 36,
		bodyHeight: 500,
		
		dialogHeight: 560,
		dialogWidth: 1000,
		
		docId: "",
		ticketId: "",
		txId: "",
		ticketBody: "",
		ticketBodyFormatted: "",
		
		timestamp: "",
		componentId: "",
		componentDesc: "",
		country: "",
		companyName: "",
		customerEmail: "",
		
		answersRendered: [],
		//{id:"answer1", text:"", url:""}, {id:"answer2", text:"", url:""}, {id:"answer3", text:"", url:""}
		
		topicSetAnswerRating: null,
		
		helpMaximized: true,
		firstRatingSet: false,
		
		constructor:function(args) {
			lang.mixin(this, args);
			for (i=1; i<=this.recallInit; i++) {
				this.answersRendered.push({id:"answer"+i, text:"test", url:""});
			}
			if (this.recall > this.recallInit) {
				this.recacll = this.recallInit;
			}
			this.bodyHeight = this.dialogHeight - this.headerHeight - this.marginsHeight - this.submitRatingHeight;
			//console.log(this.ticketId, this.answers);
		},
		
		postCreate:function() {
			//console.log(this.dialogHeight, this.dialogWidth, this.bodyHeight);
			//var ticketContentHeight = Math.round((this.bodyHeight) * 0.5);
			var ticketContentHeight = Math.round(this.bodyHeight);
			
			//var watsonContentHeight = Math.round(this.bodyHeight);
			//console.log(ticketContentHeight, watsonContentHeight);
			domStyle.set(this.ticketContentAttachPoint, "height", ticketContentHeight.toString() + "px");
			domStyle.set(this.moreInfoAttachPoint, "height", ticketContentHeight.toString() + "px");
		},
		
		startup:function() {
			this.ticketBodyFormatted = this.ticketBody.replace(/\n/g, '<br />');
			this.ticketBodyAttachPoint.innerHTML = this.ticketBodyFormatted;
			
			var moreInfoHTML = "<table cellpadding='5'>";
			moreInfoHTML += "<tr><td><b>PMR</b></td>";
			moreInfoHTML += "<td>" + this.ticketId + "</td></tr>";
			moreInfoHTML += "<tr><td><b>Timestamp</b></td>";
			moreInfoHTML += "<td>" + this.timestamp + "</td></tr>";
			moreInfoHTML += "<tr><td><b>Component ID / Machine Type</b></td>";
			moreInfoHTML += "<td>" + this.componentId + "</td></tr>";
			moreInfoHTML += "<tr><td><b>Component Desc</b></td>";
			moreInfoHTML += "<td>";
			if (this.componentDesc) moreInfoHTML += this.componentDesc;
			moreInfoHTML += "</td></tr>";
			moreInfoHTML += "<tr><td><b>Country</b></td>";
			moreInfoHTML += "<td>";
			if (this.country) moreInfoHTML += this.country;
			moreInfoHTML += "</td></tr>";
			moreInfoHTML += "<tr><td><b>Company Name</b></td>";
			moreInfoHTML += "<td>";
			if (this.companyName) moreInfoHTML += this.companyName;
			moreInfoHTML += "</td></tr>";
			moreInfoHTML += "<tr><td><b>Customer Email</b></td>";
			moreInfoHTML += "<td>";
			if (this.customerEmail) moreInfoHTML += this.customerEmail;
			moreInfoHTML += "</td></tr>";
			moreInfoHTML += "</tr>";
			moreInfoHTML += "</table>";
			this.moreInfoBodyAttachPoint.innerHTML = moreInfoHTML;
			
			//setTimeout(lang.hitch(this, "showHideHelp"), 2000);
		},
		
		save:function() {
			
		},
		
		cancel:function() {
			
		},
		
		destroy:function() {
			
		},
		
	});
});
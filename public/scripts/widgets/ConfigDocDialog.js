/*                                                                   */
/* Licensed Materials - Property of IBM                              */
/*                                                                   */
/* (C) Copyright IBM Corp. 2001, 2015. All Rights Reserved.          */
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
	"dojo/text!./templates/ConfigDocDialogTemplate.html",
	"dojo/_base/lang",
	"dojo/dom-form",
	"dojo/dom-class", 
	"dojo/dom-style",
	"dojo/topic",
	"dojo/request",
	"dojox/mobile/View",
	"scripts/constants/Constants",
	"scripts/constants/PubSubTopics",
	],
	function (declare, _Widget, _TemplatedMixin, _WidgetsInTemplateMixin, template,
			  lang, domForm, domClass, domStyle, topic, request, View,
			  Constants, PubSubTopics) {
		return declare("agentwatson.ConfigDocDialog", [_Widget, _TemplatedMixin, _WidgetsInTemplateMixin], {
		
		templateString: template,
		
		dialogHeight: 560,
		dialogWidth: 1000,
		contentHeight: 500,

		historyDocId: "",
		configDoc: {},
		timestamp: "",
		comments: "",
		
		constructor:function(args) {
			lang.mixin(this, args);
			
			this.contentHeight = this.dialogHeight - 120;
		},
		
		postCreate:function() {
			domStyle.set(this.configDocContentAttachPoint, "height", this.contentHeight.toString() + "px");
			var doc = JSON.parse(this.configDoc);
			if (!this.timestamp) this.timestamp = "";
			if (!this.comments) this.comments = "";
			resultsHTML = "<div class='configDocText'><span class='configDocHeading'>Timestamp:</span> " + this.timestamp + "</div>";
			resultsHTML += "<div class='configDocText'><span class='configDocHeading'>Comments:</span> " + this.comments + "</div>";
			resultsHTML += "<pre>";
			resultsHTML += JSON.stringify(doc, null, "    ");
			resultsHTML += "</pre>"
			this.configDocAttachPoint.innerHTML = resultsHTML;
		},
		
		close:function() {
			topic.publish(PubSubTopics.CONFIG_DOC_DIALOG_CLOSE);
		},

		revert:function() {
			topic.publish(PubSubTopics.CONFIG_DOC_DIALOG_REVERT, this.historyDocId);
		}
		
	});
});
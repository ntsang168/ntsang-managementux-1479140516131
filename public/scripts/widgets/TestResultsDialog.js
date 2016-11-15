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
	"dojo/text!./templates/TestResultsDialogTemplate.html",
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
		return declare("agentwatson.TestResultsDialog", [_Widget, _TemplatedMixin, _WidgetsInTemplateMixin], {
		
		templateString: template,
		
		dialogHeight: 560,
		dialogWidth: 1000,
		contentHeight: 500,
		
		testResults: "",
		
		constructor:function(args) {
			lang.mixin(this, args);
			
			this.contentHeight = this.dialogHeight - 120;
		},
		
		postCreate:function() {
			domStyle.set(this.testResultsContentAttachPoint, "height", this.contentHeight.toString() + "px");
			var results = JSON.parse(this.testResults);
			//console.log(results);
			resultsHTML = "<pre>";
			resultsHTML += JSON.stringify(results, null, "\t");
			resultsHTML += "</pre>"
			this.testResultsAttachPoint.innerHTML = resultsHTML;
		},
		
		close:function() {
			topic.publish(PubSubTopics.TEST_RESULTS_DIALOG_CLOSE);
		}
		
	});
});
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
	"dojo/text!./templates/ErrorTemplate.html",
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
		return declare("agentwatson.Error", [_Widget, _TemplatedMixin, _WidgetsInTemplateMixin], {
		
		templateString: template,
		
		constructor:function(args) {
			lang.mixin(this, args);
		},
		
		postCreate:function() {
			topic.subscribe(PubSubTopics.TICKET_DIALOG_SHOW_ERROR, lang.hitch(this, "showError"));
		},
		
		showError:function() {
			
		}
		
	});
});
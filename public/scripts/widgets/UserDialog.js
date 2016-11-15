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
	"dojo/text!./templates/UserDialogTemplate.html",
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
		return declare("agentwatson.UserDialog", [_Widget, _TemplatedMixin, _WidgetsInTemplateMixin], {
		
		templateString: template,
		
		newUser: false,
		existingUsers: {},
		
		userId: "ntsang@us.ibm.com",
		permissions: {},
		
		constructor:function(args) {
			lang.mixin(this, args);
		},
		
		postCreate:function() {
			if (!this.newUser) {
				this.userIdAttachPoint.value = this.userId;
				this.userIdAttachPoint.disabled = true;
				this.permissionConfigureAttachPoint.checked = this.permissions.configure;
				this.permissionAnalyticsAttachPoint.checked = this.permissions.analytics;
				this.permissionLoggingAttachPoint.checked = this.permissions.logging;
				this.permissionTestingAttachPoint.checked = this.permissions.testing;
				this.permissionAdministrationAttachPoint.checked = this.permissions.administration;
			}
		},
		
		save:function() {
			if (this.userIdAttachPoint.value == "") {
				this.userIdErrorAttachPoint.innerHTML = "required";
			} else if (this.newUser && this.existingUsers[this.userIdAttachPoint.value]) {
				this.userIdErrorAttachPoint.innerHTML = "exists already";
			} else {
				topic.publish(PubSubTopics.ADMINISTRATION_USER_SAVE,
					this.newUser,
					this.userIdAttachPoint.value,
					{
						configure: this.permissionConfigureAttachPoint.checked,
						analytics: this.permissionAnalyticsAttachPoint.checked,
						logging: this.permissionLoggingAttachPoint.checked,
						testing: this.permissionTestingAttachPoint.checked,
						administration: this.permissionAdministrationAttachPoint.checked,
					}
				);
			}
		},
		
		cancel:function() {
			topic.publish(PubSubTopics.ADMINISTRATION_USER_DIALOG_CANCEL);
		}
		
	});
});
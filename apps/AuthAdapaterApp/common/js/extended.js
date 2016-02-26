'use strict';

var Extended = Extended ? Extended : {};

Extended.Client = new _ExtendedClient;

function _ExtendedClient() {
	
	var _validationErrorInterceptor;
	
	this.setValidationErrorInterceptor = function(validationErrorInterceptor) {
		if(typeof validationErrorInterceptor === 'function') {
			_validationErrorInterceptor = validationErrorInterceptor;
		} else {
			throw new Error('"validationInterceptor" must be function which return promise.');
		}
	}
	
	this.validateTicket = function(ticket) {
		
		var validationAdapter = applicationOptions.validationAdapter;
		var validationProcedure = applicationOptions.validationProcedure;
		
		if(typeof validationAdapter !== 'string' || (typeof validationAdapter === 'string' && validationAdapter.length == 0)) {
			return Promise.reject({ error : 'Undefined or uncorrect validation adapter.'})
		}
		
		if(typeof validationProcedure !== 'string' || (typeof validationProcedure === 'string' && validationProcedure.length == 0)) {
			return Promise.reject({ error : 'Undefined or uncorrect validation procedure.'})
		}
		
		if(typeof ticket !== 'string' || (typeof ticket === 'string' && ticket.length == 0)) {
			return Promise.reject({ error : 'Undefined or uncorrect ticket.'})
		}
		
		var validationInvocationData = {
			    adapter : validationAdapter,
			    procedure : validationProcedure,
			    parameters : [ticket]
			};
		
		return WL.Client.invokeProcedure(validationInvocationData);
	}
	
	/**
	 * see {WL.Client.invokeProcedure}</br>
	 * New parameters:</br>
	 * @param invocationData.ticket - token for validating
	 * @param invocationData.forceInvocation - flag for force invocation main procedure,
	 * if true main procedure will called without validating token, but if token is not valid, result will
	 * not return, if false main procedure will called after validating token and if token is not
	 * valid, interceptor will be called.
	 */
	this.invokeProcedure = function (invocationData, options, useSendInvoke) {
		var self = this;
		
		invocationData.forceInvocation = invocationData.forceInvocation ? invocationData.forceInvocation : false;
		
		if(typeof _validationErrorInterceptor !== 'function' || invocationData.forceInvocation == true) {
			return WL.Client.invokeProcedure(invocationData, options, useSendInvoke);
		} else {
			return new Promise(function(resolve, reject) {
				var procedureError;
				
				//first step validate ticket
				self.validateTicket(invocationData.ticket)
				.then(function(){
					// if token is correct return wl invocation procedure promise
					WL.Client.invokeProcedure(invocationData, options, useSendInvoke)
					.then(function(data){
						resolve(data);
					}, function(error) {
						reject(error);
					});
				}, function(error){
					// if token is not correct use validation interceptor
					// this is interceptor must define and call after main procedure will call
					procedureError = error;
					return _validationErrorInterceptor(invocationData);
				})
				
				.then(function(newInvocationData){
					// if validation interceptor return call success
					// try to call main procedure with edited invocationData
					newInvocationData = newInvocationData ? newInvocationData : invocationData;
					WL.Client.invokeProcedure(newInvocationData, options, useSendInvoke)
					.then(function(data){
						resolve(data);
					}, function(error) {
						reject(error);
					});
				}, function(){
					reject(procedureError);
				})
			});
		}
	};
}
'use strict';

var Extended = Extended ? Extended : {};

Extended.Client = new _ExtendedClient;

function _ExtendedClient() {
	
	var _validationInterceptor;
	
	this.setValidationInterceptor = function(validationInterceptor) {
		if(typeof validationInterceptor === 'object') {
			_validationInterceptor = validationInterceptor;
		} else {
			throw new Error('"validationInterceptor" must be object.');
		}
	}
	
	this.validateToken = function(token) {
		
		var validationAdapter; //'AuthAdapter';
		var validationProcedure; //'getData';
		
		if(typeof validationAdapter !== 'string') {
			return Promise.reject({ error : 'Undefined or uncorrect validation adapter.'})
		}
		
		if(typeof validationProcedure !== 'string') {
			return Promise.reject({ error : 'Undefined or uncorrect validation procedure.'})
		}
		
		if(typeof token !== 'string') {
			return Promise.reject({ error : 'Undefined or uncorrect token.'})
		}
		
		var validationInvocationData = {
			    adapter : validationAdapter,
			    procedure : validationProcedure,
			    parameters : [token]
			};
		
		return WL.Client.invokeProcedure(validationInvocationData);
	}
	
	/**
	 * see {WL.Client.invokeProcedure}</br>
	 * New parameters:</br>
	 * @param invocationData.token - token for validating
	 * @param invocationData.forceInvocation - flag for force invocation main procedure,
	 * if true main procedure will called without validating token, but if token is not valid, result will
	 * not return, if false main procedure will called after validating token and if token is not
	 * valid, interceptor will be called.
	 */
	this.invokeProcedure = function (invocationData, options, useSendInvoke) {
		var self = this;
		
		invocationData.forceInvocation = invocationData.forceInvocation ? invocationData.forceInvocation : false;
		
		if(typeof validationInterceptor !== 'object' || invocationData.forceInvocation == true) {
			return WL.Client.invokeProcedure(invocationData, options, useSendInvoke);
		} else {
			return new Promise(function(resolve, reject) {
				//first step validate token
				self.validateToken(invocationData.token)
				.then(function(){
					// if token is correct return wl invocation procedure promise
					return WL.Client.invokeProcedure(invocationData, options, useSendInvoke);
				}, function(error){
					// if token is not correct use validation interceptor
					// this is interceptor must define and call after main procedure will call
					return validationInterceptor()
					.then(function(){
						// if validation interceptor return call success
						// try to call main procedure
						return WL.Client.invokeProcedure(invocationData, options, useSendInvoke);
					}, function(){
						reject(error);
					});
				})
				
				.then(function(data){
					resolve(data);
				}, function(error) {
					reject(error);
				});
			});
		}
	};
}
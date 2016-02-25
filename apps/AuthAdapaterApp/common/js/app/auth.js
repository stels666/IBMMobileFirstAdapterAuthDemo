(function() {
    'use strict';
    
	angular.module('app').factory('ChallengeHandler', [ChallengeHandler]);
	angular.module('app').factory('LocalUserService', ['$q', LocalUserService]);
	angular.module('app').factory('Authenticator', ['ChallengeHandler', 'LocalUserService', '$q', Authenticator]);
	
	var USER_LOGIN_IS_EMPTY_ERROR = 1;
	var USER_PASSWORD_IS_EMPTY_ERROR = 2;
	var INVALID_USER = 3;
	var USER_IS_NOT_AUTHRNTICATED = 4;
	var INVALID_TICKET = 5;
	
	/**
	 * online, local user exists and authenticated on server
	 */
	var TYPE_ONLINE_BOTH_AUTH = 1;
	
	/**
	 * online, local user exists, but doesn't authenticated on server
	 */
	var TYPE_ONLINE_LOCAL = 2;
	
	/**
	 * online, local user doesn't exist, but user was authenticated on server
	 */
	var TYPE_ONLINE_AUTH_WAS_SERVER = 3;
	
	/**
	 * online, local user doesn't exist, but authenticated on server
	 */
	var TYPE_ONLINE_BOTH_NOT_AUTH = 4;
	
	/**
	 * offline, local user exists
	 */
	var TYPE_OFFLINE_LOCAL_EXISTS = 5;
	
	/**
	 * offline, local user doesn't exists
	 */
	var TYPE_OFFLINE_LOCAL_NOT_EXISTS = 6;
	
	/**
	 * login by submit
	 */
	var TYPE_SUBMIT = 7;
	
	/**
	 * unknown
	 */
	var TYPE_UNKNOWN = 8;
	
	function Authenticator(ChallengeHandler, LocalUserService, $q){
		
		function onAccessAllowed(data, type, submitedUser) {
			switch (type) {
			case TYPE_ONLINE_BOTH_AUTH:
				WL.Logger.info('Authenticator.onAccessAllowed: TYPE_ONLINE_BOTH_AUTH');
				break;
			case TYPE_ONLINE_LOCAL:
				WL.Logger.info('Authenticator.onAccessAllowed: TYPE_ONLINE_BOTH_AUTH');
				break;
			case TYPE_ONLINE_AUTH_WAS_SERVER:
				WL.Logger.info('Authenticator.onAccessAllowed: TYPE_ONLINE_AUTH_WAS_SERVER');
				break;
			case TYPE_ONLINE_BOTH_NOT_AUTH:
				WL.Logger.info('Authenticator.onAccessAllowed: TYPE_ONLINE_BOTH_NOT_AUTH');
				break;
			case TYPE_OFFLINE_LOCAL_EXISTS:
				WL.Logger.info('Authenticator.onAccessAllowed: TYPE_OFFLINE_LOCAL_EXISTS');
				break;
			case TYPE_OFFLINE_LOCAL_NOT_EXISTS:
				WL.Logger.info('Authenticator.onAccessAllowed: TYPE_OFFLINE_LOCAL_NOT_EXISTS');
				break;
			case TYPE_SUBMIT:
				WL.Logger.info('Authenticator.onAccessAllowed: TYPE_SUBMIT');
				LocalUserService.resave(submitedUser).then(function(){
					var tt;
				}, function(error){
					var tt;
				});
				break;
			case TYPE_UNKNOWN:
			default:
				WL.Logger.info('Authenticator.onAccessAllowed: TYPE_UNKNOWN');
				break;
			}
		}
		
		function onAccessDenied(error, type) {
			switch (type) {
			case TYPE_ONLINE_BOTH_AUTH:
				WL.Logger.warn('Authenticator.onAccessDenied: TYPE_ONLINE_BOTH_AUTH');
				break;
				
			case TYPE_ONLINE_LOCAL:
				WL.Logger.warn('Authenticator.onAccessDenied: TYPE_ONLINE_LOCAL');
				if(error != null && error.code == INVALID_TICKET) {
					WL.Logger.error('Authenticator.onAccessDenied: INVALID_TICKET');
					ChallengeHandler.logout({
						onSuccess : function() {
							LocalUserService.get().then(function(user){
								ChallengeHandler.login(user, TYPE_ONLINE_LOCAL);
							}, function(error){
								WL.Logger.error(error);
							});
						},
						onFailure : function(error) {
							WL.Logger.error(error);
						}
					});
				}
				break;
				
			case TYPE_ONLINE_AUTH_WAS_SERVER:
				WL.Logger.warn('Authenticator.onAccessDenied: TYPE_ONLINE_AUTH_WAS_SERVER');
				break;
			case TYPE_ONLINE_BOTH_NOT_AUTH:
				WL.Logger.warn('Authenticator.onAccessDenied: TYPE_ONLINE_BOTH_NOT_AUTH');
				break;
			case TYPE_OFFLINE_LOCAL_EXISTS:
				WL.Logger.warn('Authenticator.onAccessDenied: TYPE_OFFLINE_LOCAL_EXISTS');
				break;
			case TYPE_OFFLINE_LOCAL_NOT_EXISTS:
				WL.Logger.warn('Authenticator.onAccessDenied: TYPE_OFFLINE_LOCAL_NOT_EXISTS');
				break;
			case TYPE_SUBMIT:
				WL.Logger.warn('Authenticator.onAccessDenied: TYPE_SUBMIT');
				break;
			case TYPE_UNKNOWN:
			default:
				WL.Logger.warn('Authenticator.onAccessDenied: TYPE_UNKNOWN');
				break;
			}
		}
		
		function online(){
			// Init ChallengeHandler, it is required.
			ChallengeHandler.init({ onAccessAllowed : onAccessAllowed, onAccessDenied : onAccessDenied });
			LocalUserService.get().then(function(user){
				if(ChallengeHandler.isUserAuthenticated()){
					// online, local user exists and authenticated on server
					onAccessAllowed(null, TYPE_ONLINE_BOTH_AUTH);
				} else {
					// try to submit without redirect to login page
					// online, local user exists, but doesn't authenticated on server
					ChallengeHandler.login(user, TYPE_ONLINE_LOCAL);
				}
			}, function(error){
				if(ChallengeHandler.isUserAuthenticated()){
					// if user doesn't exists on local device, we know that
					// authentication is invalid and we have to try logout on server
					ChallengeHandler.logout({ 
						onSuccess : function() {
							// online, local user doesn't exist, but authenticated on server
							onAccessDenied(null, TYPE_ONLINE_AUTH_WAS_SERVER);
						}, 
						onFailure : function(error) {
							// online, local user doesn't exist, but authenticated on server
							onAccessDenied(error, TYPE_ONLINE_AUTH_WAS_SERVER);
						} 
					});
				} else {
					onAccessDenied(null, TYPE_ONLINE_BOTH_NOT_AUTH);
				}
			});
		}
		
		function offline(){
			LocalUserService.get().then(function(user){
				// offline, local user exists
				onAccessAllowed({ ticket : user.ticket }, TYPE_OFFLINE_LOCAL_EXISTS);
			}, function(error){
				// offline, local user doesn't exists
				onAccessDenied(error, TYPE_OFFLINE_LOCAL_NOT_EXISTS);
			});
		}
		
		function connectDetected(){
			connectToServer().then(function(){
				init(true);
			}, function(){
				init(false);
			});
		}
		
		function disconnectDetected(){
			ChallengeHandler.destroy();
		}
		
		function init(onlineMode){
			document.addEventListener(WL.Events.WORKLIGHT_IS_CONNECTED, connectDetected, false);
			document.addEventListener(WL.Events.WORKLIGHT_IS_DISCONNECTED, disconnectDetected, false);
			if(onlineMode) {
				online();
			} else {
				offline();
			}
		}
		
		function connectToServer() {
			var defer = $q.defer();
			// Check Internet connection
		    WL.Device.getNetworkInfo(
		        function (networkInfo) {
		        	// if connection is active, try to connect to mf server
		        	// if type of device is DESKTOPBROWSER or PREVIEW, we can suppose that
		        	// Internet connection is ok, because this type use only for development
		            if (networkInfo.isNetworkConnected == "true" || 
		            		WL.Client.getEnvironment() === WL.Environment.DESKTOPBROWSER || 
		            		WL.Client.getEnvironment() === WL.Environment.PREVIEW) {
		            	WL.Client.connect({
		    				onSuccess : function() {
		    					// If server connection is successful
		    					defer.resolve();
		    				},
		    				onFailure : function() {
		    					// If server connection is failure
		    					defer.reject();
		    				}
		    			});
		            } else {
		            	// If Internet connection is failure
		            	defer.reject();
		            }
		        }
		    );
		    return defer.promise;
		}
		
		function login(user) {
			ChallengeHandler.login(user, TYPE_SUBMIT);
		}
		
		function logout(options){
			ChallengeHandler.logout(options);
		}
		
		/**
		 * @param options.firstPageState
		 * @param options.loginPageState
		 */
		return function(options) {
			connectDetected();
			return {
				login : login,
				logout : logout
			}
		}
	}
	
	/**
	 * Errors:
	 * USER_LOGIN_IS_EMPTY_ERROR = 1;
	 * USER_PASSWORD_IS_EMPTY_ERROR = 2;
	 * INVALID_USER = 3;
	 * USER_IS_NOT_AUTHRNTICATED = 4;
	 * INVALID_TICKET = 5;
	 */
    function ChallengeHandler() {
		var REALM = 'AuthAdapterRealm';
		
		var _handler = null;
		var _onAccessDenied = null;
		var _onAccessAllowed = null;
		var _type = null;
		var _submitedUser = null;
		
		var ResponseUtil = {
				isNotFromChallengeRequest : function(response) {
					return response != null && response.request != null && response.request.options != null && 
						(response.request.options.fromChallengeRequest == null || response.request.options.fromChallengeRequest == false);
				},
				
				containsAuth : function(response) {
					return response != null && response.responseJSON != null && response.responseJSON.auth != null;
				}
		}
		/**
		 * @param options.onAccessAllowed(data) - callback for success access,
		 * data.ticket - ticket for current user;
		 * 
		 * @param options.onAccessDenied(error) - callback for fail access,
		 * error.code - code of error,
		 * error.message - error description,
		 * error.fromChallengeRequest - flag that indicates that the request was called from challenge.
		 */
		function init(options) {
			if(_handler == null){
				_handler = WL.Client.createChallengeHandler(REALM);
			}
			_handler.isCustomResponse = isCustomResponse;
			_handler.handleChallenge = handleChallenge;
			_onAccessAllowed = options.onAccessAllowed;
			_onAccessDenied = options.onAccessDenied;
		}
		
		function destroy(){
			if(_handler != null){
				_handler = null;
			}
			clearTemp();
		}
		
		function clearTemp() {
			_type = null;
			_submitedUser = null;
		}
		
		function isChallengeHandlerCreated(){
			return _handler == null;
		}
		
		function isCustomResponse(response) {
			// Check server response.
			// First condition - response must contain auth object
			if(ResponseUtil.containsAuth(response)){
				// Second condition - if 'response.request.options.fromChallengeRequest' field is false or
				// undefined, it means, that action was calling not from challenge,
				// perhaps, user or system tried to call protected adapter procedure.
				// If auth object contains error, call access denied function.
				if(ResponseUtil.isNotFromChallengeRequest(response) && response.responseJSON.auth.error) {
					WL.Logger.error('ChallengeHandler: ' + response.responseJSON.auth.errorMsg);
					if(_onAccessDenied != null) 
						_onAccessDenied(
							{ 
								code : response.responseJSON.auth.errorCode, 
								message : response.responseJSON.auth.errorMsg, 
								fromChallengeRequest : false 
							}, 
							TYPE_ONLINE_LOCAL);
					return false;
				}
				return true;
			}
			return false;
		}
		
		function handleChallenge(response) {
			var error = response.responseJSON.auth.error;
			var errorCode = response.responseJSON.auth.errorCode;
			var errorMessage = response.responseJSON.auth.errorMsg;
			var ticket = response.responseJSON.auth.ticket;
			 
		    if (error == true){
		    	WL.Logger.error('ChallengeHandler: ' + errorMessage);
		    	if(_onAccessDenied != null) _onAccessDenied({ code : errorCode, message : errorMessage, fromChallengeRequest : true }, _type);
		    } else if (error == false){
		    	WL.Logger.info('ChallengeHandler: User is successfully logged.');
		    	_submitedUser.ticket = ticket;
		    	if(_onAccessAllowed != null) _onAccessAllowed({ ticket : ticket }, _type, _submitedUser);
		    }
		    
		    clearTemp();
		}
		
		function login(user, type){
			if(_handler == null){
				WL.Logger.error('ChallengeHandler: Handler is not initialized.');
				return;
			}
			
			_type = type == null ? TYPE_UNKNOWN : type;
			_submitedUser = user;
			
			var invocationData = {
			        adapter : 'AuthAdapter',
			        procedure : 'login',
			        parameters : [ user.login, user.password, user.ticket ]
			    };
			_handler.submitAdapterAuthentication(invocationData, {});
		}
		
		function logout(options) {
			WL.Client.logout(REALM, options);
		}
		
		function isUserAuthenticated() {
			return WL.Client.isUserAuthenticated(REALM)
		}
		
		return {
			init : init,
			login : login,
			logout : logout,
			destroy : destroy,
			isUserAuthenticated : isUserAuthenticated,
			isChallengeHandlerCreated : isChallengeHandlerCreated
		}
	}
    
    
    function LocalUserService($q) {
		
		var CACHE_KEY = 'LocalUserCacheKey';
		var USER_NAME_KEY = 'username';
		var PASSWORD_KEY = 'password';
		var TICKET_KEY = 'ticket';
		
		var cachedUserName = undefined;
		var cachedTicket = undefined;
		
		function getErrorMessage(error){
			switch (error) {
			case WL.EncryptedCache.ERROR_KEY_CREATION_IN_PROGRESS:
				return 'ERROR_KEY_CREATION_IN_PROGRESS';
			case WL.EncryptedCache.ERROR_LOCAL_STORAGE_NOT_SUPPORTED:
				return 'ERROR_LOCAL_STORAGE_NOT_SUPPORTED';
			case WL.EncryptedCache.ERROR_NO_EOC:
				return 'ERROR_NO_EOC';
			case WL.EncryptedCache.ERROR_COULD_NOT_GENERATE_KEY:
				return 'ERROR_COULD_NOT_GENERATE_KEY';
			case WL.EncryptedCache.ERROR_CREDENTIALS_MISMATCH:
				return 'ERROR_CREDENTIALS_MISMATCH';
			case 901:
				return 'ERROR_USER_NOT_FOUND';
			case 902:
				return 'ERROR_USER_FIELDS_ARE_EMPTY';
			default:
				return 'UNKNOWN - ' + error;
			}
    	}
		
		function get(){
			var defer = $q.defer();
			var user = {};
			
			WL.EncryptedCache.open(CACHE_KEY, true, function(){
				WL.EncryptedCache.read(USER_NAME_KEY, function(value){
					user.login = value;
					cachedUserName = value;
					WL.EncryptedCache.read(PASSWORD_KEY, function(value){
						user.password = value;
						WL.EncryptedCache.read(TICKET_KEY, function(value){
							user.ticket = value;
							cachedTicket = value;
							WL.EncryptedCache.close(function(){
								if(user.login != null && user.password != null && user.ticket != null){
									defer.resolve(user);
								} else {
									// 901 - ERROR_USER_NOT_FOUND
									defer.reject({ code : 901, status : getErrorMessage(901) });
								}
							}, onFail);
						}, onFail);
					}, onFail);
				}, onFail);
			}, onFail);
			
			function onFail(status) {
				defer.reject({ code : status, status : getErrorMessage(status) });
			}
			
			return defer.promise;
		}
		
		function store(user){
			var defer = $q.defer();
			
			if(user == null || user.login == null || user.password == null || user.ticket == null){
				// 902 - ERROR_USER_FIELDS_ARE_EMPTY
				defer.reject({ code : 902, status : getErrorMessage(902) });
				return defer.promise;
			}
			
			WL.EncryptedCache.open(CACHE_KEY, true, function(){
				WL.EncryptedCache.write(USER_NAME_KEY, user.login, function() {
					cachedUserName = user.login;
					WL.EncryptedCache.write(PASSWORD_KEY, user.password, function() {
						WL.EncryptedCache.write(TICKET_KEY, user.ticket, function() {
							cachedTicket = user.ticket;
							WL.EncryptedCache.close(function(){
								defer.resolve(user);
							}, onFail);
						}, onFail);
					}, onFail);
				}, onFail);
			}, onFail);
			
			function onFail(status) {
				defer.reject({ code : status, status : getErrorMessage(status) });
			}
			
			return defer.promise;
		}
		
		function storeTicket(ticket){
			var defer = $q.defer();
			
			if(user.ticket == null){
				// 902 - ERROR_USER_FIELDS_ARE_EMPTY
				defer.reject({ code : 902, status : getErrorMessage(902) });
				return defer.promise;
			}
			
			WL.EncryptedCache.open(CACHE_KEY, true, function(){
				WL.EncryptedCache.write(TICKET_KEY, ticket, function() {
					cachedTicket = ticket;
					WL.EncryptedCache.close(function(){
						defer.resolve();
					}, onFail);
				}, onFail);
			}, onFail);
			
			function onFail(status) {
				defer.reject({ code : status, status : getErrorMessage(status) });
			}
			
			return defer.promise;
		}
		
		function cache(){
			var defer = $q.defer();
			
			WL.EncryptedCache.open(CACHE_KEY, true, function(){
				WL.EncryptedCache.read(USER_NAME_KEY, function(value){
					cachedUserName = value;
					WL.EncryptedCache.read(TICKET_KEY, function(value){
						cachedTicket = value;
						WL.EncryptedCache.close(function(){
							defer.resolve();
						}, onFail);
					}, onFail);
				}, onFail);
			}, onFail);
			
			function onFail(status) {
				defer.reject({ code : status, status : getErrorMessage(status) });
			}
			
			return defer.promise;
		}
		
		function destroy(){
			var defer = $q.defer();
			
			WL.EncryptedCache.destroy(function(){
				cachedUserName = undefined;
				cachedTicket = undefined;
				defer.resolve();
			}, function (status) {
				defer.reject({ code : status, status : getErrorMessage(status) });
			});
			
			return defer.promise;
		}
		
		function resave(user){
			var defer = $q.defer();
			
			function onFailure(error){
				defer.reject(error);
			}
			
			destroy().then(function(){
				return store(user);
			}, onFailure).then(function(user){
				defer.resolve(user);
			}, onFailure);
			
			return defer.promise;
		}
		
		return {
			get : get,
			store : store,
			destroy : destroy,
			cache : cache,
			storeTicket : storeTicket,
			resave : resave,
			getCachedUserName : function() {
				return cachedUserName;
			},
			getCachedTicket : function() {
				return cachedTicket;
			}
		}
	}
    
})();
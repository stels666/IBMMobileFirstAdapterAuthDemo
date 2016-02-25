var REALM = 'AuthAdapterRealm';

var USER_LOGIN_IS_EMPTY_ERROR = 1;
var USER_PASSWORD_IS_EMPTY_ERROR = 2;
var INVALID_USER = 3;
var USER_IS_NOT_AUTHRNTICATED = 4;
var INVALID_TICKET = 5;

/**
 * Create and return success login response.
 * @param ticket - ticket for current session.
 * @returns success response.
 */
function loginSuccess(ticket) {
	return {
		auth : {
			error : false,
			ticket : ticket,
			date : new Date()
		}
    };
}

/**
 * Create and return failure login response
 * @param code - error code
 * @param msg - error message
 * @returns failure response
 */
function loginFailure(code, msg, isDataProcedure){
	
	var response = {
			auth : {
				error : true,
				errorCode : code,
				errorMsg : msg,
				date : new Date()
			}
	    };
	
	if(isDataProcedure == "true" || isDataProcedure == true) {
		response.isSuccessful = false;
	}
	
	return response;
}

/**
 * Returns an object with the user identity properties.
 * @param username - current user name
 * @param ticket - current ticket
 * @returns user identity
 */
function createUserIdentity(username, ticket){
	return {
        userId: username,
        displayName: username,
        attributes: {
            ticket : ticket
        }
	};
}

function login(username, password, ticket) {
	
	username = username ? username : null;
	password = password ? password : null;
	ticket = ticket ? ticket : null;
	
	if(username == null) return onAuthRequired(null, 'User login cannot be empty.', USER_LOGIN_IS_EMPTY_ERROR);
	if(password == null) return onAuthRequired(null, 'User password cannot be empty.', USER_PASSWORD_IS_EMPTY_ERROR);

	// Try to check user -> connect to CAS Server -> get ticket.
	// If ticket will be not empty, auth is successful.
	var newTicket = com.auth.demo.Authenticator.checkCredentials(username, password, ticket);
	
	if (newTicket != null){
		com.auth.demo.Authenticator.onLoginSuccess();
		WL.Server.setActiveUser(REALM, createUserIdentity(username, newTicket));
        return loginSuccess(newTicket);
    }
	
    return onAuthRequired(null, "Invalid user.", INVALID_USER);
}

function onAuthRequired(headers, errorMessage, errorCode, isDataProcedure) {
	com.auth.demo.Authenticator.onLoginFailure();
	errorMessage = errorMessage ? errorMessage : null;
    return loginFailure(errorCode, errorMessage, isDataProcedure);
}

function validateToken(token) {
	var newTicket = com.auth.demo.Authenticator.checkCredentials(null, null, ticket);
	if(newTicket == null){
		return onAuthRequired(null, "Invalid ticket.", INVALID_TICKET, true);
	} else {
		return loginSuccess(newTicket);
	}
}

function onLogout() {
	com.auth.demo.Authenticator.onLogout();
}

function getData(ticket) {
	ticket = ticket ? ticket : null;
	
	var newTicket = com.auth.demo.Authenticator.checkCredentials(null, null, ticket);
	if(newTicket == null){
		return onAuthRequired(null, "Invalid ticket.", INVALID_TICKET, true);
	}
	
	return { data : 'Hello World!!!'};
}
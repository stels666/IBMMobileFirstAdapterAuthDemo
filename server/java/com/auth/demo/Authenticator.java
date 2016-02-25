package com.auth.demo;

import java.util.logging.Logger;

public class Authenticator {
	
	private static final Logger LOGGER = Logger.getLogger(Authenticator.class.getName());
	
	public static void onLoginSuccess(){
		LOGGER.info("onLoginSuccess");
	}
	
	public static void onLoginFailure(){
		LOGGER.info("onLoginFailure");
	}
	
	public static void onLogout(){
		LOGGER.info("onLogout");
	}
	
	public static String checkCredentials(String username, String password, String ticket) {
		if(ticket != null && "_test_ticket_".equalsIgnoreCase(ticket)){
			return ticket;
		} else if("user".equalsIgnoreCase(username) && "user".equalsIgnoreCase(password)){
			return "_test_ticket_";
		}
		return null;
	}

}

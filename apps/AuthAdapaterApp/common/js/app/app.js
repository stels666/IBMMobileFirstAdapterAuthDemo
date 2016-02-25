(function() {
    'use strict';
    
    angular.module('app', ['ionic', 'ui.router']);
	angular.module('app').config([ '$stateProvider', '$urlRouterProvider', config ]);
	
	function config($stateProvider, $urlRouterProvider) {

		$stateProvider.state('login', {
			cache : false,
			url : '/login',
			templateUrl : 'templates/login.html',
			controller : 'LoginCtrl as vm'
		});

		$stateProvider.state('main', {
			cache : false,
			url : '/main',
			templateUrl : 'templates/main.html',
			controller : 'MainCtrl as vm'
		});

		$urlRouterProvider.otherwise('/login');
	}
    
})();
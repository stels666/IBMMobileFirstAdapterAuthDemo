(function() {
    'use strict';
    
    angular.module('app').controller('LoginCtrl', ['Authenticator', '$scope', '$state', '$timeout', LoginCtrl]);
    
    function LoginCtrl(Authenticator, $scope, $state, $timeout) {
		var vm = this;
		
		vm.showLoginBlock = true;
		vm.error = undefined;
		vm.submit = submit;
		
		vm.login = undefined;
		vm.password = undefined;
		
		var auth = Authenticator();
		
		function setData(showLoginBlock, error){
			vm.showLoginBlock = showLoginBlock;
			if(error != null){
				vm.error = error;
			}
			$scope.$apply();
		}
		
		function submit(){
			auth.login({ login : vm.login, password : vm.password });
		}
	}
    
})();
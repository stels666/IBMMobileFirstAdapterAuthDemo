(function() {
    'use strict';
    
    angular.module('app').controller('MainCtrl', ['ChallengeHandler', '$scope', MainCtrl]);
    
    function MainCtrl(ChallengeHandler, $scope) {
		var vm = this;
		
		vm.data = undefined;
		vm.error = undefined;
		vm.callAdapter = callAdapter;
		vm.logout = logout;
		
		function callAdapter() {
			var invocationData = {
				    adapter : 'AuthAdapter',
				    procedure : 'getData',
				    parameters : ['eeeeeeeee']
				};
			Extended.Client.invokeProcedure(invocationData)
			.then(function(data){
				vm.data = data;
				$scope.$apply();
			}, function(error){
				vm.error = error;
				$scope.$apply();
			});
		}
		
		function logout() {
			ChallengeHandler.logout();
		}
	}
    
})();
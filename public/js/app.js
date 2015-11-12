var appServices = angular.module('appServices', []);
appServices
  .service('ProductService', ['$http', '$q', function ($http, $q) {
    return {
      load: function () {
        console.info("Loading products...");
        var deferred = $q.defer();
        $http.get("/api/1/products.json")
          .success(function (data) {
            deferred.resolve(data);
          })
          .error(function () {
            deferred.reject();
          });
        return deferred.promise;
      }
    };
  }])

var appControllers = angular.module('appControllers', []);
appControllers
  .controller('AppController', ['$scope', 'ProductService',
  function ($scope, ProductService) {
      $scope.data = {
        products: [],
        cart: {
          product: null,
          quantity: 1,
          state: null
        }
      }

      $scope.priceBeforeTaxes = function () {
        if ($scope.data.cart.product) {
          return $scope.data.cart.product.price * $scope.data.cart.quantity
        } else {
          return 0;
        }
      }

      ProductService.load().then(function (products) {
        console.log("Loaded", products);
        $scope.data.products = products;
      });


  }])


var app = angular.module('app', ['appControllers', 'appServices']);

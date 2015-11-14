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
    }
  }])
  .service('PricingService', ['$http', '$q', function ($http, $q) {
    return {
      load: function () {
        console.info("Loading pricing engines...");
        var deferred = $q.defer();
        $http.get("/api/1/pricers.json")
          .success(function (data) {
            deferred.resolve(data);
          })
          .error(function () {
            deferred.reject();
          });
        return deferred.promise;
      },
      price: function (engine, price, quantity, state) {
        console.info("Computing price for", arguments);
        var deferred = $q.defer();
        $http.get("/api/1/price.json?pricer=" + engine.id + "&price=" + price + "&quantity=" + quantity + "&state=" + state)
          .success(function (data) {
            deferred.resolve(data);
          })
          .error(function (error, status) {
            deferred.reject({ error: error, status: status });
          });
        return deferred.promise;
      }
    }
  }])

var appControllers = angular.module('appControllers', []);
appControllers
  .controller('AppController', ['$scope', 'ProductService', 'PricingService',
  function ($scope, ProductService, PricingService) {
      $scope.data = {
        products: [],
        pricingEngines: [],
        cart: {
          product: null,
          quantity: 1,
          state: null,
          prices: {}
        }
      }

      $scope.priceBeforeTaxes = function () {
        if ($scope.data.cart.product) {
          return $scope.data.cart.product.price * $scope.data.cart.quantity
        } else {
          return 0;
        }
      }

      $scope.computePrices = function () {
        $scope.data.cart.prices = {}
        
        $.each($scope.data.pricingEngines, function (_, engine) {
          PricingService.price(engine,
              $scope.data.cart.product.price,
              $scope.data.cart.quantity,
              $scope.data.cart.state)
            .then(function (result) {
              console.info("Price:", result)
              $scope.data.cart.prices[engine.id] = result
            }, function (error) {
              console.error(error);
              $scope.data.cart.prices[engine.id] = "Error:" + error.error + ", Status:" + error.status
            })
        })
      }

      ProductService.load().then(function (products) {
        console.log("Found products", products);
        $scope.data.products = products;
      });

      PricingService.load().then(function (engines) {
        console.log("Found pricing engines", engines);
        $scope.data.pricingEngines = engines;
      });

  }])


var app = angular.module('app', ['appControllers', 'appServices']);

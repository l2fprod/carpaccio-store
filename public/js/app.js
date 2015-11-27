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
      },
      register: function(engineName, engineEndpoint) {
        console.log("Registering new endpoint", arguments);
        var deferred = $q.defer();
        $http.post("/api/1/registerPricer.json",
                   {name: engineName, url: engineEndpoint})
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
  .service('MonitorService', ['$http', '$q', function ($http, $q) {
    return {
      load: function () {
        console.info("Loading monitor...");
        var deferred = $q.defer();
        $http.get("/api/1/monitor.json")
          .success(function (data) {
            deferred.resolve(data);
          })
          .error(function () {
            deferred.reject();
          });
        return deferred.promise;
      },
      log: function (cart) {
        // TODO post complete cart
        var value = cart.product.price*cart.quantity
        var deferred = $q.defer();
        $http.get("/api/1/logTransaction.json?value="+value)
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

var appControllers = angular.module('appControllers', []);
appControllers
  .controller('AppController', ['$scope', 'ProductService', 'PricingService', 'MonitorService',
  function ($scope, ProductService, PricingService, MonitorService) {
      $scope.data = {
        products: [],
        pricingEngines: [],
        cart: {
          product: null,
          quantity: 1,
          state: null,
          prices: {}
        },
        registerPricer: {
        }
      }

      $scope.loadPricingEngines = function() {
        PricingService.load().then(function (engines) {
          console.log("Found pricing engines", engines);
          $scope.data.pricingEngines = engines;
        });
      }
      
      $scope.priceBeforeTaxes = function () {
        if ($scope.data.cart.product) {
          return $scope.data.cart.product.price * $scope.data.cart.quantity
        } else {
          return 0;
        }
      }

      $scope.registerPricingEngine = function() {
        PricingService.register($scope.data.registerPricer.name, $scope.data.registerPricer.endpoint)
        .then(function(result) {
          console.log(result)
          $('#registerPricerDialog').modal('hide')
          // reload engines
          $scope.loadPricingEngines()
        }, function(error) {
            console.error(error)
            var message = (error && error.error && error.error.error) ? error.error.error : ""+error        
            $('#registerPricerDialog').find('#registerError').text(message)
        })
      }
      
      $scope.computePrices = function () {
        $scope.data.cart.prices = {}

        MonitorService.log($scope.data.cart)
        .then(function(result) {
          console.log("Monitor:", result)
        }, function (error) {
          console.error(error);
        })

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
              if ( error.error && error.error.error ) {
                $scope.data.cart.prices[engine.id] = "Error: " + error.error.error + ", Status:" + error.status
              } else if ( error.error && error.error.message ) {
                $scope.data.cart.prices[engine.id] = "Error: " + error.error.message
              }else {
                $scope.data.cart.prices[engine.id] = "Error: " + error
              }
            })
        })
      }

      $scope.loadPricingEngines()
      
      ProductService.load().then(function (products) {
        console.log("Found products", products);
        $scope.data.products = products;
      });

  }])

  .controller('DashboardController', ['$scope', 'MonitorService',
  function ($scope, MonitorService) {
    $scope.data = {
        monitor: {}
    }
    MonitorService.load().then(function (monitor) {
      console.log("Found monitor", monitor);
      $scope.data.monitor = monitor;
    });
  }])


var app = angular.module('app', ['appControllers', 'appServices']);

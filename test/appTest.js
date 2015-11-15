var expect  = require("chai").expect;
var request = require("request");

describe("Carpaccio Store API", function() {

  describe("Productes", function() {
    var url = "http://localhost:6001/api/1/products.json"

    it("returns status 200", function(done) {
      request(url, function(error, response, body) {
        expect(response.statusCode).to.equal(200)
        done()
      })
    })

    it("returns products", function(done) {
        request(url, function(error, response, body) {
          var info = JSON.parse(body)
          expect(info.length).to.be.above(3)
          expect(info[0]).to.have.property("price")
          done()
        })
    })

  })

  describe("Pricers", function() {
    var url = "http://localhost:6001/api/1/pricers.json"

    it("returns status 200", function(done) {
      request(url, function(error, response, body) {
        expect(response.statusCode).to.equal(200)
        done()
      })
    })

    it("returns pricers", function(done) {
        request(url, function(error, response, body) {
          var info = JSON.parse(body)
          expect(info.length).to.be.above(2)
          expect(info[0]).to.have.property("id")
          expect(info[0]).to.have.property("name")
          done()
        })
    })

  });

  describe("RegisterPricer", function() {
    var url = "http://localhost:6001/api/1/registerPricer.json"

    var testPricer = {
      "id:": "testing",
      "name": "Testing Pricer",
      "url": "http://testing/pricing"
    }

    // TODO allow to pass without restarting server
    it("returns new pricer", function(done) {
      request.post({
          url: url,
          json: true,
          body: testPricer
        }, function(error, response, body) {
        expect(response.statusCode).to.equal(200)
        expect(body).to.include(testPricer)
        done()
      })
    })

    it("returns error on duplicate pricer", function(done) {
      request.post({
          url: url,
          json: true,
          body: testPricer
        }, function(error, response, body) {
        expect(response.statusCode).to.equal(400)
        done()
      })
    })

  });

  describe("Price", function() {

    var getUrl = function(pricer,price,quantity,state) {
      return "http://localhost:6001/api/1/price.json"
        +"?pricer="+pricer
        +"&price="+price
        +"&quantity="+quantity
        +"&state="+state
    }

    it("returns status 404 on missing engine", function(done) {
      var url = getUrl("NO-engine",0,0,"")
      request(url, function(error, response, body) {
        expect(response.statusCode).to.equal(404)
        done()
      })
    })

    it("CURRENTLY returns status 501", function(done) {
      var url = getUrl("engine-1",1,1,"")
      request(url, function(error, response, body) {
        expect(response.statusCode).to.equal(501)
        done()
      })
    })

/*
    it("returns a price", function(done) {
      var url = getUrl("engine-1",13,1313,"UT")
      request(url, function(error, response, body) {
        expect(response.statusCode).to.equal(404)
        done()
      })
    })
*/

  })

  describe("Monitor", function() {

    var getMonitorUrl = function(pricer,price,quantity,state) {
      return "http://localhost:6001/api/1/monitor.json"
    }

    var getPriceUrl = function(pricer,price,quantity,state) {
      return "http://localhost:6001/api/1/price.json"
        +"?pricer="+pricer
        +"&price="+price
        +"&quantity="+quantity
        +"&state="+state
    }

    var monitor0

    it("returns status 200", function(done) {
      var url = getMonitorUrl()
      request(url, function(error, response, body) {
        expect(response.statusCode).to.equal(200)
        var info = JSON.parse(body)
        expect(info).to.have.property("count")
        expect(info).to.have.property("total")
        expect(info).to.have.property("prices")

        monitor0 = info
        done()
      })
    })

    it("calculates a price", function(done) {
      var urlPrice = getPriceUrl("engine-1",13,13,"")
      request(urlPrice, function(error, response, body) {
        // CURRENTLY
        expect(response.statusCode).to.equal(501)
        done()
      })
    })

    it("has logged pricing", function(done) {
      var url = getMonitorUrl()
      request(url, function(error, response, body) {
        expect(response.statusCode).to.equal(200)
        var info = JSON.parse(body)
        expect(info.count).to.equal(monitor0.count)
        expect(info.total).to.equal(monitor0.total)
        expect(info.prices).to.have.property("Team 1")
        // later
        //expect(info.prices).to.have.property("engine-1",0)
        done()
      })
    })

  })

})

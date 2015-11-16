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
      "id": "testing",
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

    var getMonitorUrl = function() {
      return "http://localhost:6001/api/1/monitor.json"
    }

    var getPriceUrl = function(pricer,price,quantity,state) {
      return "http://localhost:6001/api/1/price.json"
        +"?pricer="+pricer
        +"&price="+price
        +"&quantity="+quantity
        +"&state="+state
    }

    var getLogUrl = function(value) {
      return "http://localhost:6001/api/1/logTransaction.json?value="+value
    }

    var getHistoryUrl = function(title) {
      return "http://localhost:6001/api/1/logHistory.json?title="+title
    }

    var monitor0

    it("returns status 200", function(done) {
      var url = getMonitorUrl()
      request(url, function(error, response, body) {
        expect(response.statusCode).to.equal(200)
        var info = JSON.parse(body)
        expect(info).to.have.property("current")
        expect(info).to.have.property("history")
        expect(info.current).to.have.property("count")
        expect(info.current).to.have.property("value")
        expect(info.current).to.have.property("prices")

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
        expect(info.current.count).to.equal(monitor0.current.count)
        expect(info.current.value).to.equal(monitor0.current.value)
        expect(info.current.prices).to.have.property("Team 1",0)
        done()
      })
    })

    it("has logged transaction", function(done) {
      var url = getLogUrl(13)
      request(url, function(error, response, body) {
        expect(response.statusCode).to.equal(200)
        var info = JSON.parse(body)
        var current = info.current
        expect(current.count).to.equal(monitor0.current.count+1)
        expect(current.value).to.equal(monitor0.current.value+13)
        done()
      })
    })

    it("has pushes history", function(done) {
      var url = getHistoryUrl("Test History")
      request(url, function(error, response, body) {
        expect(response.statusCode).to.equal(200)
        var info = JSON.parse(body)
        expect(info.current.count).to.equal(0)
        expect(info.current.value).to.equal(0)
        expect(info.history).to.have.length(monitor0.history.length+1)
        expect(info.history[info.history.length-1]).to.have.property("title","Test History")
        done()
      })
    })
  })

  describe("Scenario", function() {

    var getMonitorUrl = function() {
      return "http://localhost:6001/api/1/monitor.json"
    }

    var getScenarioUrl = function(id,title) {
      return "http://localhost:6001/api/1/scenario.json"
        + (id?"?id="+id+"&title="+title:"")
    }

    var monitor0

    it("snapshot monitor", function(done) {
      var url = getMonitorUrl()
      request(url, function(error, response, body) {
        expect(response.statusCode).to.equal(200)
        var info = JSON.parse(body)
        monitor0 = info
        done()
      })
    })

    it("shows available scenarios", function(done) {
      var url = getScenarioUrl()
      request(url, function(error, response, body) {
        expect(response.statusCode).to.equal(200)
        var info = JSON.parse(body)
        expect(info).to.have.length.above(3)
        done()
      })
    })

    it("unchanged monitor", function(done) {
      var url = getMonitorUrl()
      request(url, function(error, response, body) {
        expect(response.statusCode).to.equal(200)
        var info = JSON.parse(body)
        expect(info).to.eql(monitor0)
        done()
      })
    })

    it("execute a scenario", function(done) {
      var url = getScenarioUrl(1,"Test Scenario")
      request(url, function(error, response, body) {
        expect(response.statusCode).to.equal(200)
        done()
      })
    })

    it("changed monitor", function(done) {
      var url = getMonitorUrl()
      request(url, function(error, response, body) {
        expect(response.statusCode).to.equal(200)
        var info = JSON.parse(body)
        // TODO some testing
        expect(info.history).to.have.length(monitor0.history.length+1)
        expect(info.history[info.history.length-1]).to.have.property("title","Test Scenario: First")
        expect(info.history[info.history.length-1]).to.have.property("value",1313*13)
        done()
      })
    })

  })


})

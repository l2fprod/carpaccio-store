var expect  = require("chai").expect;
var request = require("supertest");

describe("Carpaccio Store API", function() {

  var server;
  before(function () {
    server = require('../app.js');
  })

  after(function () {
    //server.close();
  })

  it('responds to /', function(done) {
    request(server)
      .get('/')
      .expect(200, done);
  })

  describe("Products", function() {
    var path = "/api/1/products.json"

    it("returns status 200", function(done) {
      request(server)
        .get(path)
        .expect(200,done)
    })

    it("returns products", function(done) {
      request(server)
        .get(path)
        .expect(function(res) {
          var info = res.body
          expect(info.length).to.be.above(3)
          expect(info[0]).to.have.property("price")
        })
        .expect(200,done)
    })

  })

  describe("Pricers", function() {
    var path = "/api/1/pricers.json"

    it("returns status 200", function(done) {
      request(server)
        .get(path)
        .expect(200,done)
    })

    it("returns pricers", function(done) {
      request(server)
        .get(path)
        .expect(function(res) {
          var info = res.body
          expect(info.length).to.be.above(2)
          expect(info[0]).to.have.property("id")
          expect(info[0]).to.have.property("name")
        })
        .expect(200,done)
    })

  });

  describe("RegisterPricer", function() {
    var path = "/api/1/registerPricer.json"

    var testPricer = {
      "id": "testing",
      "name": "Testing Pricer",
      "url": "http://testing/pricing"
    }

    // TODO allow to pass without restarting server
    it("returns new pricer", function(done) {
      request(server)
        .post(path)
        .send(testPricer)
        .expect(function(res) {
          expect(res.body).to.include(testPricer)
        })
        .expect(200,done)
    })

    it("returns error on duplicate pricer", function(done) {
      request(server)
        .post(path)
        .send(testPricer)
        .expect(400,done)
    })

  })

  describe("Price", function() {

    var getPath = function(pricer,price,quantity,state) {
      return "/api/1/price.json"
        +"?pricer="+pricer
        +"&price="+price
        +"&quantity="+quantity
        +"&state="+state
    }

    it("returns status 404 on missing engine", function(done) {
      var path = getPath("NO-engine",0,0,"")
      request(server)
        .get(path)
        .expect(404,done)
    })

    it("CURRENTLY returns status 501", function(done) {
      var path = getPath("engine-1",1,1,"")
      request(server)
        .get(path)
        .expect(501,done)
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

    var getMonitorPath = function() {
      return "/api/1/monitor.json"
    }

    var getPricePath = function(pricer,price,quantity,state) {
      return "/api/1/price.json"
        +"?pricer="+pricer
        +"&price="+price
        +"&quantity="+quantity
        +"&state="+state
    }

    var getLogPath = function(value) {
      return "/api/1/logTransaction.json?value="+value
    }

    var getHistoryPath = function(title) {
      return "/api/1/logHistory.json?title="+title
    }

    var monitor0

    it("returns status 200", function(done) {
      var path = getMonitorPath()
      request(server)
        .get(path)
        .expect(function(res) {
          var info = res.body
          expect(info).to.have.property("current")
          expect(info).to.have.property("history")
          expect(info.current).to.have.property("count")
          expect(info.current).to.have.property("value")
          expect(info.current).to.have.property("prices")

          monitor0 = info
        })
        .expect(200,done)
    })

    it("calculates a price", function(done) {
      var path = getPricePath("engine-1",13,13,"")
      request(server)
        .get(path)
        .expect(501,done)
    })

    it("has logged pricing", function(done) {
      var path = getMonitorPath()
      request(server)
        .get(path)
        .expect(function(res) {
          var info = res.body
          expect(info.current.count).to.equal(monitor0.current.count)
          expect(info.current.value).to.equal(monitor0.current.value)
          expect(info.current.prices).to.have.property("Team 1",0)
        })
        .expect(200,done)
    })

    it("has logged transaction", function(done) {
      var path = getLogPath(13)
      request(server)
        .get(path)
        .expect(function(res) {
          var info = res.body
          var current = info.current
          expect(current.count).to.equal(monitor0.current.count+1)
          expect(current.value).to.equal(monitor0.current.value+13)
        })
        .expect(200,done)
    })

    it("has pushes history", function(done) {
      var path = getHistoryPath("Test History")
      request(server)
        .get(path)
        .expect(function(res) {
          var info = res.body
          expect(info.current.count).to.equal(0)
          expect(info.current.value).to.equal(0)
          expect(info.history).to.have.length(monitor0.history.length+1)
          expect(info.history[info.history.length-1]).to.have.property("title","Test History")
        })
        .expect(200,done)
    })

  })

  describe("Scenario", function() {

    var getMonitorPath = function() {
      return "/api/1/monitor.json"
    }

    var getScenarioPath = function(id,title) {
      return "/api/1/scenario.json"
        + (id?"?id="+id+"&title="+title:"")
    }

    var monitor0

    it("snapshot monitor", function(done) {
      var path = getMonitorPath()
      request(server)
        .get(path)
        .expect(function(res) {
          monitor0 = res.body
        })
        .expect(200,done)
    })

    it("shows available scenarios", function(done) {
      var path = getScenarioPath()
      request(server)
        .get(path)
        .expect(function(res) {
          var info = res.body
          expect(info).to.have.length.above(3)
          info.forEach(function(scenario) {
            expect(scenario).to.have.deep.all.keys("id", "name", "description", "prices", "quantities", "states", "taxes", "discounts")
          })
        })
        .expect(200,done)
    })

    it("unchanged monitor", function(done) {
      var path = getMonitorPath()
      request(server)
        .get(path)
        .expect(function(res) {
          var info = res.body
          expect(info).to.eql(monitor0)
        })
        .expect(200,done)
    })

    it("execute a scenario", function(done) {
      var path = getScenarioPath(1,"Test Scenario")
      request(server)
        .get(path)
        .expect(200,done)
    })

    it("changed monitor", function(done) {
      var path = getMonitorPath()
      request(server)
        .get(path)
        .expect(function(res) {
          var info = res.body
          expect(info.history).to.have.length(monitor0.history.length+1)
          expect(info.history[info.history.length-1]).to.have.property("title","Test Scenario: First")
          expect(info.history[info.history.length-1]).to.have.property("value",1313*13)
        })
        .expect(200,done)
    })

  })

})

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

})

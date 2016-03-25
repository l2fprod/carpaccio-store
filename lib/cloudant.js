var uuid = require('uuid'),
  async = require('async'),
  CloudantFactory = require('cloudant')

function Database(username, password) {
  var self = this

  var cloudant,
    targetDbName = "carpaccio-store"

  CloudantFactory({
    account: username,
    password: password
  }, function (err, dbInstance) {
    if (err) {
      return console.error(err)
    }

    cloudant = dbInstance
    console.log("Connected to cloudant")

    var dbCreated = false
    cloudant.db.list(function (err, allDatabases) {
      console.log('Existing databases: %s', allDatabases.join(', '));
      allDatabases.forEach(function (dbName) {
        if (targetDbName == dbName) {
          dbCreated = true
        }
      })

      if (dbCreated) {
        self.targetDb = cloudant.db.use(targetDbName)
      } else {
        cloudant.db.create(targetDbName, seedDB)
      }
    })
  })

  function seedDB(callback) {
    self.targetDb = cloudant.use(targetDbName);
    var dbEntries = [];

    async.waterfall([
      function (next) {
        var designDocs = [
          {
            _id: '_design/pricerById',
            views: {
              all: {
                map: function (doc) {
                  if (doc.type === 'pricer') {
                    emit(doc.id, doc);
                  }
                }
              }
            }
          },
          {
            _id: '_design/pricerByName',
            views: {
              all: {
                map: function (doc) {
                  if (doc.type === 'pricer') {
                    emit(doc.name, doc);
                  }
                }
              }
            }
          }
        ];
        async.each(designDocs, targetDb.insert, next);
      },
      function (next) {
        async.each(dbEntries, targetDb.insert, next);
      },
      function (next) {
        console.log("Created DB", targetDbName, "and populated it with initial data");
        next();
      }
    ], callback)
  }


  self.states = JSON.parse(require('fs').readFileSync('states.json', 'utf8'))

  self.getStates = function (callback) {
    callback(null, self.states);
  }

  self.getPricers = function (callback) {
    self.targetDb.view("pricerByName", "all", {
      include_docs: true
    }, function (err, body) {
      if (err) {
        callback(err)
      } else {
        var pricers = [];
        body.rows.forEach(function (doc) {
          pricers.push(doc.doc);
        });
        callback(err, pricers)
      }
    })
  }

  self.addPricer = function (pricer, callback) {
    pricer.id = uuid.v1();
    pricer.type = "pricer"
    self.targetDb.insert(pricer, {}, function (err, body) {
      if (err) {
        callback(err)
      } else {
        callback(null, pricer)
      }
    })
  }

  self.clearPricers = function (callback) {
    self.targetDb.view("pricerById", "all", {
      include_docs: true
    }, function (err, body) {
      if (err) {
        callback(err)
      } else {
        var docs = {
          docs: []
        }
        body.rows.forEach(function (row) {
          row.doc._deleted = true
          docs.docs.push(row.doc)
        });
        self.targetDb.bulk(docs, {}, function (err, body) {
          if (err) {
            callback(err, body)
            return
          }
          console.log("Cleared pricers", body, docs.docs)
          callback(err, docs.docs)
        })
      }
    })
  }

  self.getPricerByName = function (name, callback) {
    self.targetDb.view("pricerByName", "all", {
      key: name,
      include_docs: true,
      limit: 1
    }, function (err, body) {
      if (err) {
        callback(err)
      } else if (body.rows.length == 0) {
        callback(null, null)
      } else {
        callback(null, body.rows[0].doc)
      }
    })
  }

  self.getPricerById = function (id, callback) {
    self.targetDb.view("pricerById", "all", {
      key: id,
      include_docs: true,
      limit: 1
    }, function (err, body) {
      if (err) {
        callback(err)
      } else {
        callback(null, body.rows[0].doc)
      }
    })
  }

  self.restoreMonitor = function (callback) {
    self.targetDb.get("monitorBackup", {}, function (err, body) {
      if (err) {
        console.log("Monitor created", newmonitor)
        callback(null, undefined)
      } else {
        console.log("Monitor restored", body.monitor)
        callback(null, body.monitor)
      }
    })
  }

  self.saveMonitor = function (monitor, callback) {
    self.targetDb.get("monitorBackup", {}, function (err, body) {
      if (err) {
        console.log("Create monitorBackup", monitor)
        body = {
          monitor: undefined
        }
      }
      // update existing document with new monitor
      body.monitor = monitor
      self.targetDb.insert(body, "monitorBackup", function (err, body) {
        if (err) {
          callback(err)
        } else {
          console.log("Monitor saved", body)
          callback(null)
        }
      })
    })
  }

  self.clearMonitor = function (callback) {
    self.restoreMonitor(function (err, oldMonitor) {
      self.saveMonitor(undefined, function (err, monitor) {
        if (err) {
          callbeck(err, null)
          return
        }
        console.log("Cleared monitor")
        callback(err, oldMonitor)
      })
    })
  }

}

module.exports = function (username, password) {
  return new Database(username, password);
};

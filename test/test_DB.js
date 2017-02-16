const assert = require('assert')
const DB = require('../src/db')
const Db = require('mongodb').Db

describe('test for DB class', function() {
  it('#successful connection: db getDB shoude pass a native mongo db instance to callback', function(done) {
    let uri = 'mongodb://localhost:27017/data'
    let db = new DB(uri)
    db.getDB(db => {
      assert.ok(db instanceof Db)
      done()
    })
  })
})

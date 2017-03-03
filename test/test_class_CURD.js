const assert = require('assert')
const DB = require('../src').DB
const types = require('../src').types
const DOC = require('../src').DOC
const Books1 = require('./books1')
const Books2 = require('./books2')
const ObjectID = require('mongodb').ObjectID
const Db = require('mongodb').Db
const Collection = require('mongodb').Collection

describe('test for class\'s CURD opeartion', function() {
  describe('#class\'s insertion', function() {
    let uri = 'mongodb://localhost:27017/data'
    let db = new DB(uri)
    it('this should successfully insert a doc into database', function(done) {
      Books1.setDB(db)
      Books1.insertOne({
        title: 'The Three-Body Problem',
        author: 'Liu Cixin',
        publish: new Date(2006),
        keywords: ['Scifi'],
        price: 19.52
      }).then( r => {
        assert.ok(r.insertedCount === 1)
        done()
      })
    })
    it('this should successfully insert many docs into database', function(done) {
      Books1.setDB(db)
      Books1.insertMany([
          {title:'title1', author:'author1', publish:new Date(2008), keywords:['keyword1'], price: 21.5},
          {title:'title2', author:'author2', publish:new Date(2009), keywords:['keyword2'], price: 22.5},
          {title:'title3', author:'author3', publish:new Date(2010), keywords:['keyword3'], price: 23.5}
      ]).then( r => {
        assert.ok(r.length === 3)
        r.forEach(v => assert.ok(v.insertedCount === 1))
        done()
      })
    })
  })
})

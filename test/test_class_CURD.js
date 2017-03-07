const assert = require('assert')
const DB = require('..').DB
const types = require('..').types
const DOC = require('..').DOC
const Books1 = require('./books1')
const Books2 = require('./books2')
const ObjectID = require('mongodb').ObjectID
const Db = require('mongodb').Db
const Collection = require('mongodb').Collection

describe('test for class\'s CURD opeartion', function() {
  describe('#class\'s insertion', function() {
    let uri = 'mongodb://localhost:27017/data'
    let db = new DB(uri)
    it('this should throw error when using deprecated insert function', function() {
      assert.throws(() => {
        Book1.insert()
      }, Error)
    })
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
  describe('#class\'s update', function() {
    let uri = 'mongodb://localhost:27017/data'
    let db = new DB(uri)
    it('this should throw error when using deprecated findAndModify function', function() {
      assert.throws(() => {
        Books1.findAndModify()
      })
    })
    it('this should find doc with title1, and replaced with {title: "title1_u", author: "author1_u", publish: new Date(2007), keywords:["keyword1_u"], price:21.6}', function(done) {
      Books1.setDB(db)
      Books1.replaceOne({title: "title1"}, {title: "title1_u", author: "author1_u", publish: new Date(2007), keywords:["keyword1_u"], price:21.6}).then(r => {
        assert.ok(r.modifiedCount === 1)
        assert.ok(r.matchedCount === 1)
        done()
      })
    })
    it('this should successfully update a doc where title is title2, updating field author from author2 to author2_u', function(done) {
      Books1.updateOne({title: 'title2'}, {$set: {author: 'author2_u'}})
        .then(r => {
          assert.ok(r.result.ok === 1)
          done()
        })
    })
    it('this should throw error, when update argument to updateOne can\'t pass schema defination', function() {
      assert.throws(() => {
       Books1.updateOne({title: 'title3'}, {price: 101})
      })
   })
  })
})

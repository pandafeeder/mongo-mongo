const assert = require('assert')
const DB = require('..').DB
const types = require('..').types
const DOC = require('..').DOC
const Books1 = require('./books1')
const Books2 = require('./books2')
const ObjectID = require('mongodb').ObjectID
const Db = require('mongodb').Db
const Collection = require('mongodb').Collection

describe('test for doc instance\'s prototype', function() {
  describe('class constructor with no db in super(data)', function() {
    let book = new Books1()
    it('prototype of instance should have the following property setup:__allSetup, __unique, __sparse, __collection, __schema, __default, __requiredButNoDefault, __defined, __setup, __inited', function() {
       let proto = Object.getPrototypeOf(book)
       let properties = ['__allSetup', '__unique', '__sparse', '__collection', '__schema', '__default', '__requiredButNoDefault', '__defined', '__setup', '__inited']
       properties.forEach(v => {
         assert.ok(proto.hasOwnProperty(v))
      })
    })
    it('prototype of instance should also have the following descriptor property: title,author,publish,copies,price,brought,keywords', function() {
       let proto = Object.getPrototypeOf(book)
       let properties = ['title','author','publish','copies','price','brought','keywords']
       properties.forEach(v => {
         assert.ok(proto.hasOwnProperty(v))
      })
    })
  })

  describe('class constructor with super(db, data)', function() {
    let book = new Books2()
    it('prototype of instance should have the following property setup:__allSetup, __unique, __sparse, __collection, __schema, __default, __requiredButNoDefault, __defined, __setup, __inited, __db', function() {
       let proto = Object.getPrototypeOf(book)
       let properties = ['__allSetup', '__unique', '__sparse', '__collection', '__schema', '__default', '__requiredButNoDefault', '__defined', '__setup', '__inited', '__db']
       properties.forEach(v => {
         assert.ok(proto.hasOwnProperty(v))
      })
    })
    it('prototype of instance should also have the following descriptor property: title,author,publish,price,brought,keywords', function() {
       let proto = Object.getPrototypeOf(book)
       let properties = ['title','author','publish','price','brought','keywords']
       properties.forEach(v => {
         assert.ok(proto.hasOwnProperty(v))
      })
    })
  })
})

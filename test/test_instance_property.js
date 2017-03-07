const assert = require('assert')
const DB = require('..').DB
const types = require('..').types
const DOC = require('..').DOC
const Books1 = require('./books1')
const Books2 = require('./books2')
const ObjectID = require('mongodb').ObjectID
const Db = require('mongodb').Db
const Collection = require('mongodb').Collection


describe('test for doc instance:', function() {
  describe('class constructor with super(data)', function() {
    describe('#instance constructed with no argument', function() {
      let book = new Books1()
      it('__data should only have _id property, and _id should be a ObjectID instance', function() {
        assert.ok(Object.keys(book.__data).length === 1)
        assert.ok(book.__data._id instanceof ObjectID)
      })
      it('__saved property should be false', function() {
        assert.strictEqual(book.__saved, false)
      })
      it('__checked property should be false', function() {
        assert.strictEqual(book.__checked, false)
      })
      it('__updatedField property should be an empty array', function() {
        assert.ok(Array.isArray(book.__updatedField))
        assert.ok(book.__updatedField.length === 0)
      })
    })

    describe('#instance constructed with data arguments', function() {
      let book = new Books1({title: '2666', price: 89.8, publish: new Date(), keywords:['history', 'novel']})
      let book2 = new Books1({_id: 1234567, title: '2666', price: 89.8, publish: new Date()})
      it('this should throw Error when none plain object passed to constructor,', function() {
        assert.throws(() => {
          let book = new Books1('TEST')
        }, Error)
        assert.throws(() => {
          let book = new Books1(100)
        }, Error)
      })
      it('this should throw Error when undefined field passed to constructor', function() {
        assert.throws(() => {
          let book = new Books1({age: 11, publish: new Date})
          book.save()
        }, Error)
      })
      it('test for getter function', function() {
        assert.equal(book2.title, '2666')
      })
      it('test for setter function', function() {
        book2.title = 'Red and Black'
        assert.equal(book2.title, 'Red and Black')
      })
      it('test for getCollectionName, this should return books1 for book2', function() {
        assert.equal(book2.getCollectionName(), 'books1')
      })
      it('__data should have _id, title, price, publish, keywords, and brought(default), _id should be a ObjectID instance', function() {
        assert.ok(Object.keys(book.__data).length === 6)
        assert.ok(book.__data._id instanceof ObjectID)
      })
      it('__saved property should be false', function() {
        assert.strictEqual(book.__saved, false)
      })
      it('__checked property should be true', function() {
        assert.strictEqual(book.__checked, true)
      })
      it('__updatedField property should be an empty array', function() {
        assert.ok(Array.isArray(book.__updatedField))
        assert.ok(book.__updatedField.length === 0)
      })
      it('this should throw error, when title is not string', function() {
        assert.throws(function() {
          let book = new Books1({title: 2666, publish: new Date()})
        }, Error)
      })
      it('this should throw error, when price doesn\'t pass custom validator', function() {
        assert.throws(function() {
          let book = new Books1({title: '2666', price: 8.9, publish: new Date()})
        }, Error)
        assert.throws(function() {
          let book = new Books1({title: '2666', price: 111.1, publish: new Date()})
        }, Error)
      })
      it('this should throw error, when copies is not integer', function() {
        assert.throws(function() {
          let book = new Books1({title: '2666', price: 11.1, copies: 10.2, publish: new Date()})
        }, Error)
      })
      it('this should throw error, when publish is not provided', function() {
        assert.throws(function() {
          let book = new Books1({title: '2666'})
        }, Error)
      })
      it('this should throw error, when brought is not boolean', function() {
        assert.throws(function() {
          let book = new Books1({title: '2666', publish: new Date(), brought: 'yes'})
        }, Error)
      })
      it('if data argument has _id field, instance\'s __id and __data._id shoude be that _id field', function() {
        assert.strictEqual(book2.__id, 1234567)
        assert.strictEqual(book2.__data._id, 1234567)
      })
    })
  })

  describe('class constructor with super(db, data)', function() {
    describe('#instance constructed with no argument', function() {
      let book = new Books2()
      it('__data should only have _id property, and _id should be a ObjectID instance', function() {
        assert.ok(Object.keys(book.__data).length === 1)
        assert.ok(book.__data._id instanceof ObjectID)
      })
      it('__saved property should be false', function() {
        assert.strictEqual(book.__saved, false)
      })
      it('__checked property should be false', function() {
        assert.strictEqual(book.__checked, false)
      })
      it('__updatedField property should be an empty array', function() {
        assert.ok(Array.isArray(book.__updatedField))
        assert.ok(book.__updatedField.length === 0)
      })
    })
    describe('#instance constructed with data argument', function() {
      let book = new Books2({title: '2666', price: 89.8, publish: new Date()})
      let book2 = new Books2({_id: 1234567, title: '2666', price: 89.8, publish: new Date()})
      it('__data should have _id, title, price, publish, and brought(default) should be a ObjectID instance', function() {
        assert.ok(Object.keys(book.__data).length === 5)
        assert.ok(book.__data._id instanceof ObjectID)
      })
      it('__saved property should be false', function() {
        assert.strictEqual(book.__saved, false)
      })
      it('__checked property should be true', function() {
        assert.strictEqual(book.__checked, true)
      })
      it('__updatedField property should be an empty array', function() {
        assert.ok(Array.isArray(book.__updatedField))
        assert.ok(book.__updatedField.length === 0)
      })
      it('if data argument has _id field, instance\'s __id and __data._id shoude be _id', function() {
        assert.strictEqual(book2.__id, 1234567)
        assert.strictEqual(book2.__data._id, 1234567)
      })
    })
  })
})

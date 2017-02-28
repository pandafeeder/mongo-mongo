const assert = require('assert')
const DB = require('../src').DB
const types = require('../src').types
const DOC = require('../src').DOC
const Books1 = require('./books1')
const Books2 = require('./books2')
const ObjectID = require('mongodb').ObjectID
const Db = require('mongodb').Db
const Collection = require('mongodb').Collection

describe('test for instance\' CURD opeartion', function() {
  describe('#class constructor with super(data)', function() {
    let uri = 'mongodb://localhost:27017/data'
    let db = new DB(uri)
    it('new instance with no arguments, save before assigning any data, this should throw a error', function() {
      let book = new Books1()
      Books1.setDB(db)
      assert.throws(() => {
        book.save()
      }, Error)
    })
    it('new instance with no arguments, assign later, this should successfully saved', function(done) {
      let book = new Books1()
      Books1.setDB(db)
      book.title = '2666'
      book.author = 'Roberto Bolaño'
      book.publish = new Date(2008,11,11)
      book.copies = 5000,
      book.price = 15.2
      book.brought = true
      book.keywords = ['novel','history']
      book.save().then(result => {
        assert.ok(result.result.ok === 1)
        done()
      })
    })
    it('new instance with no arguments, assign later without required field,  this should throw error', function() {
      let book = new Books1()
      Books1.setDB(db)
      book.title = '2666'
      book.author = 'Roberto Bolaño'
      book.copies = 5000,
      book.price = 15.2
      book.brought = true
      book.keywords = ['novel','history']
      assert.throws(() => {
        book.save()
      }, Error)
    })
    it('new instance with no arguments, assign later and same value for unique field, this should get a MongoError', function(done) {
      let book = new Books1()
      Books1.setDB(db)
      book.title = '2666'
      book.author = 'Roberto Bolaño'
      book.publish = new Date(2008,11,11)
      book.copies = 5000,
      book.price = 15.2
      book.brought = true
      book.keywords = ['novel','history']
      book.save().catch(e => {
        assert.ok(e.name === 'MongoError');
        done()
      })
    })
    it('new instance with no arguments, assign later without required&&default field,  this should pass', function(done) {
      let book = new Books1()
      Books1.setDB(db)
      book.title = 'Last Evenings on Earth'
      book.author = 'Roberto Bolaño'
      book.publish = new Date(2007,3,30)
      book.copies = 5000,
      book.price = 15.2
      book.keywords = ['novel','history']
      book.save().then(r => {
        assert.ok(r.insertedCount === 1)
        done()
      })
    })
    it('new instance with arguments, this should successfully saved', function(done) {
      let book = new Books1({
        title: '时间的朋友',
        author: '李笑来',
        publish: new Date(),
        price: 10.5,
        keywords: ['time', 'life']
      })
      book.save().then(r => {
        assert.ok(r.insertedCount === 1)
        done()
      })
    })
  })
  //describe('#class constructor with super(db, data)', function() {
  //  it('', function() {
  //  })
  //  it('', function() {
  //  })
  //})
})

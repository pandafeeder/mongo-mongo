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
    it('new instance with arguments, this should successfully saved, another save should call update', function(done) {
      let book = new Books1({
        title: '时间的朋友',
        author: '李笑来',
        publish: new Date(),
        price: 10.5,
        keywords: ['time', 'life']
      })
      book.save().then(r => {
        assert.ok(r.insertedCount === 1)
        book.price = 11.5
        book.save().then(r => {
          assert.ok(r.modifiedCount === 1)
          done()
        })
      })
    })
    it('call update before save should throw error', function(){
      let book = new Books1({
        title: '时间的朋友',
        author: '李笑来',
        publish: new Date(),
        price: 10.5,
        keywords: ['time', 'life']
      })
      assert.throws(() => {
        book.update()
      }, Error)
    })
    it('new instance without arguments, add data using addData function, then save it', function(done) {
      let book = new Books1()
      book.addData({
        title: 'Conversation in the Cathedral',
        author: 'Mario Vargas Llosa',
        publish: new Date(1969),
        price: 30.5,
        keywords: ['novel']
      })
      assert.ok(book.title === 'Conversation in the Cathedral')
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
  describe('static class methods for CURD', function() {
    it('findOneAndNew should return a newly created instance, then update it', function(done) {
      Books1.findOneAndNew({title: 'Conversation in the Cathedral'}).then(obj => {
        assert.ok(obj.__saved === true)
        obj.price = 40.5
        obj.save().then(r => {
          assert.ok(r.modifiedCount === 1)
          done()
        })
      })
    })
    it('it should throw error when calling insert which is deprecated', function() {
      assert.throws(() => {
        Books1.insert()
      },Error)
    })
    it('insertOne should just call native insertOne to do the CREATE opeartion, should pay attension that when insert this way, constrains on schema is not checked', function(done) {
      Books1.insertOne({
        title: '7 databases in 7 weeks',
        author: 'Eric Redmond and Jim R. Wilson',
        publish: new Date(2012,4,11),
        price: 35,
      }).then(r => {
        assert.ok(r.insertedCount === 1)
        done()
      })
    })
    it('test class\'s insertMany', function(done) {
      let data = [{title: 't1', publish: 'p1'},{title: 't2', publish: 't2'},{title: 't3', publish: 't3'}]
      Books1.insertMany(data)
        .then(r => {
          assert.ok(r.insertedCount === data.length)
          done()
        })
    })
    it('this should throw error when using class\'s static findAndModify which is depreacted by native driver', function() {
      assert.throws(() => {
        Books1.findAndModify()
      }, Error)
    })
  })
})

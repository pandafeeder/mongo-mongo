const Author = require('./Models').Author
const assert = require('assert')
const ObjectID = require('mongodb').ObjectID 
const INSTANCES = require('./instances')
const DOC = require('..').DOC
const Int = require('..').types.Int
const DB = require('..').DB
const Collection = require('mongodb').Collection


describe('test for doc instance\'s own property and prototype\'s property:', function() {
  /////////////////////
  describe('test for Book instance:', function() {
    //************
    describe('new Book with argument', function() {
      let book1 = INSTANCES.book1
      let author1 = INSTANCES.author1
      //----------------
      describe('own property', function() {
        it('#1.book1\'s __data should have these 10 properites', function() {
          ['_id','title','author','publish','created','keywords','copies','soldout','recommedation','price'].forEach(v => {
            assert.ok(book1['__data'].hasOwnProperty(v))
          })
          assert.equal(Object.keys(book1.__data).length, 10)
        })
        it('#2.book1\'s __data.id\'s constructor should be ObjectID ', function() {
          assert.equal(book1.__data._id.constructor.name, 'ObjectID')
          assert.ok(book1.__data._id instanceof ObjectID)
        })
        it('#3.book1\'s __data.author1\'s should be an Author instance', function() {
          assert.equal(book1.__data.author.constructor.name, 'Author')
          assert.ok(book1.__data.author instanceof Author)
        })
        it('#4.book1 shouldn\'t have any enumberable properties', function() {
          assert.equal(Object.keys(book1).length, 0)
        })
        it('#5.getData should return __data', function() {
          assert.deepEqual(book1.getData(), book1.__data)
        })
      })
      //----------------
      describe('prototype\'s property', function() {
        it('#1.prototype should have these properties', function() {
          [
            '__inited','__schema','__collection','__unique','__sparse','__default','__embedded','__required',
            '__allSetup','__setup','__defined','__requiredButNoDefault','title','author','publish','created',
            'keywords','copies','soldout','recommedation','price',
          ].forEach(v => {
            assert.ok(book1.__proto__.hasOwnProperty(v))
          })
          assert.equal(Object.keys(book1.__proto__).length, 21)
        })
      })
    })

    //************
    describe('new Book without argument', function() {
      let book2 = INSTANCES.book2
      let author1 = INSTANCES.author1
      book2.title = 'Last Evenings on Earth'
      book2.author = author1
      book2.publish = new Date(2007,3,29)
      book2.price = 9.85
      book2.copies = 1000
      book2.recommedation = {
        reviewer: 'Wayne Kostenbaum',
        comment: 'I am addicted to the haze that floats above Bolaño\'s fiction.'
      }
      book2.keywords = ['novel']
      book2.soldout = true
      //----------------
      describe('own property', function() {
        it('#1.book2\'s __data should have these 10 properites', function() {
          ['_id','title','author','publish','created','keywords','copies','soldout','recommedation','price'].forEach(v => {
            assert.ok(book2['__data'].hasOwnProperty(v))
          })
          assert.equal(Object.keys(book2.__data).length, 10)
        })
        it('#2.book2\'s __data.id\'s constructor should be ObjectID ', function() {
          assert.equal(book2.__data._id.constructor.name, 'ObjectID')
          assert.ok(book2.__data._id instanceof ObjectID)
        })
        it('#3.book2\'s __data.author1\'s should be an Author instance', function() {
          assert.equal(book2.__data.author.constructor.name, 'Author')
          assert.ok(book2.__data.author instanceof Author)
        })
        it('#4.book2 shouldn\'t have any enumberable properties', function() {
          assert.equal(Object.keys(book2).length, 0)
        })
        it('#5.getData should return __data', function() {
          assert.deepEqual(book2.getData(), book2.__data)
        })
      })
      //----------------
      describe('prototype\'s property', function() {
        it('#1.prototype should have these properties', function() {
          [
            '__inited','__schema','__collection','__unique','__sparse','__default','__embedded','__required',
            '__allSetup','__setup','__defined','__requiredButNoDefault','title','author','publish','created',
            'keywords','copies','soldout','recommedation','price',
          ].forEach(v => {
            assert.ok(book2.__proto__.hasOwnProperty(v))
          })
          assert.equal(Object.keys(book2.__proto__).length, 21)
        })
        it('#2.getCollectionName should return books for book2', function() {
          assert.equal(book2.getCollectionName(), 'books')
        })
      })
    })
  })

  /////////////////////
  describe('test when _id is defined in schema', function() {
    class Test extends DOC {
      constructor(data) {
        super(data)
        this.setSchema({
          _id: Int
        })
      }
    }
    it('#1.instance of Test should have _id as Int', function() {
      let t = new Test({_id: 1})
      assert.ok(t._id === 1)
    })
  })

  /////////////////////
  describe('test for supre(db, data)', function() {
    it('#1.when no _id in schema, instance\'s __data shoule have a _id with type ObjectID', function() {
      class Test extends DOC {
        constructor(db, data) {
          super(db, data)
          this.setSchema({
            name: String,
            age: Int
          })
        }
      }
      let uri = 'mongodb://localhost:27017/data'
      let db = new DB(uri)
      let t = new Test(db, {name:'name', age:10})
      assert.ok(t.__data._id instanceof ObjectID)
    })
    it('#2.when _id in schema, instance\'s __data shoule have a Int _id', function() {
      class Test extends DOC {
        constructor(db, data) {
          super(db, data)
          this.setSchema({
            _id: Int,
            name: String,
            age: Int
          })
        }
      }
      let uri = 'mongodb://localhost:27017/data'
      let db = new DB(uri)
      let t = new Test(db, {_id:1, name:'name', age:10})
      assert.ok(t.__data._id === 1)
    })
    it('#3.when class has setCollectionName defined, its prototype.__collection should set accordingly', function() {
      class House extends DOC {
        constructor(data) {
          super(data)
          this.setSechma({
            price: Number
          })
        }
        static setCollectionName() {
          return 'houses'
        }
      }
      let uri = 'mongodb://localhost:27017/data'
      let db = new DB(uri)
      House.setDB(db)
      assert.equal(House.prototype.__collection, 'houses')
    })
    it('#4.class method getCollection should invoke passed callback with argument as db', function(done) {
      class Test extends DOC {
        constructor(data) {
          super(data)
          this.setSchema({
            name: String
          })
        }
        static setCollectionName() {
          return 'test_collection_name'
        }
      }
      let uri = 'mongodb://localhost:27017/data'
      let db = new DB(uri)
      Test.setDB(db)
      Test.getCollection(col => {
        assert.ok(col instanceof Collection)
        done()
      })
    })
  })
})

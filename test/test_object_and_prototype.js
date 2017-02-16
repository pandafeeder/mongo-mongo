const assert = require('assert')
const DB = require('../src').DB
const types = require('../src').types
const DOC = require('../src').DOC
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
      it('__data should have _id, title, price, publish, keywords, and brought(default) should be a ObjectID instance', function() {
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
      it('this should throw error, when price is not float', function() {
        assert.throws(function() {
          let book = new Books1({title: '2666', price: 11, publish: new Date()})
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
  })

  describe('class constructor with super(db, data)', function() {
  })

  describe('class constructor with super()', function() {
  })
})


describe('test for class', function() {
  it('directly new DOC class should throw Error', function() {
    assert.throws(() => {
      let d = new DOC()
    }, Error)
  })
  it('it should throw Error when sub class\'s construct call super without argument', function() {
    class TEST extends DOC {
      constructor(data) {
        super()
        this.setSchema({name: String})
      }
    }
    assert.throws(() => {
      let t = new TEST()
    }, Error)
  })
  it('this should throw Error when argument to setSchema is not a plain object', function() {
    class TEST extends DOC {
      constructor(data) {
        super(data)
        this.setSchema('TEST')
      }
    }
    assert.throws(() => {
      let t = new TEST()
    }, Error)
  })
  it('this should throw Error when the first argument is not DB instance when 2 arguments passed to super', function() {
    class TEST extends DOC {
      constructor(data) {
        super('TEST', data)
      }
    }
    assert.throws(() => {
      let t = new TEST()
    }, Error)
  })
  it('this should throw Error when the second argument is not plain object when 2 arguments passed to super', function() {
    const uri = 'mongodb://localhost:27017/data'
    const db = new DB(uri)
    class TEST extends DOC {
      constructor(data) {
        super(db, data)
      }
    }
    assert.throws(() => {
      let t = new TEST('TEST')
    }, Error)
  })
  it('this should throw Error when super is not called as super(db, data) or super(data)', function() {
    class TEST extends DOC {
      constructor(data) {
        super('TEST', 'TEST2', 'TEST3')
      }
    }
    assert.throws(() => {
      let t = new TEST()
    }, Error)
  })
  it('this should throw Error when not supported schema field is used', function() {
    class TEST extends DOC {
      constructor(data) {
        super(data)
        this.setSchema({
        age: {
          type: types.Int,
          required: true,
          max: 100
        }
        })
      }
    }
    assert.throws(() => {
      let t = new TEST()
    }, Error)
  })
  it('this should throw Error when uqniue is not boolean type', function() {
    class TEST extends DOC {
      constructor(data) {
        super(data)
        this.setSchema({
          age: {
            type: types.Int,
            unique: 1
          }
        })
      }
    }
    assert.throws(() => {
      let t = new TEST()
    }, Error)
  })
  it('this should throw Error when sparse is not boolean type', function() {
    class TEST extends DOC {
      constructor(data) {
        super(data)
        this.setSchema({
          age: {
            type: types.Int,
            sparse: 1
          }
        })
      }
    }
    assert.throws(() => {
      let t = new TEST()
    }, Error)
  })
  it('this should throw Error when no type defined for a schema field', function() {
    class TEST extends DOC {
      constructor(data) {
        super(data)
        this.setSchema({
          age: {
            unique: true
          }
        })
      }
    }
    assert.throws(() => {
      let t = new TEST()
    }, Error)
  })
  it('this should throw Error when validator is not function', function() {
    class TEST extends DOC {
      constructor(data) {
        super(data)
        this.setSchema({
          age: {
            type: types.Int,
            validator: true
          }
        })
      }
    }
    assert.throws(() => {
      let t = new TEST()
    }, Error)
  })
  it('this should throw Error data is not Array but type is []', function() {
    class TEST extends DOC {
      constructor(data) {
        super(data)
        this.setSchema({
          friends: []
        })
      }
    }
    assert.throws(() => {
      let t = new TEST({friends: 'HanMeimei'})
    }, Error)
  })
  it('this should throw Error data is not Array but type is [String]', function() {
    class TEST extends DOC {
      constructor(data) {
        super(data)
        this.setSchema({
          friends: [String]
        })
      }
    }
    assert.throws(() => {
      let t = new TEST({friends: 'HanMeimei'})
    }, Error)
  })
  it('this should throw Error when Array type has more than one sub types like: [String, Number]', function() {
    class TEST extends DOC {
      constructor(data) {
        super(data)
        this.setSchema({
          friends: [String, Number]
        })
      }
    }
    assert.throws(() => {
      let t = new TEST({friends: 'HanMeimei'})
    }, Error)
  })
  it('this should throw Error when schema is not object, function, or Array', function() {
    class TEST extends DOC {
      constructor(data) {
        super(data)
        this.setSchema({
          age: 'Int'
        })
      }
    }
    assert.throws(() => {
      let t = new TEST({age: 11})
    }, Error)
  })
  it('this should throw Error since no db is set', function() {
    class TEST extends DOC {
      constructor(data) {
        super(data)
        this.setSchema({
          age: 'Int'
        })
      }
    }
    assert.throws(() => {
      TEST.getCollection(col => {
        console.log(col)
      })
    }, Error)
    assert.throws(() => {
      TEST.getDB(db => {
        console.log(db)
      })
    }, Error)
  })
  it('this shoude pass a Db/Collection instance to callback when db is supplied by setDB(db)', function(done) {
    class TEST extends DOC {
      constructor(data) {
        super(data)
        this.setSchema({
          age: types.Int
        })
      }
    }
    const uri = 'mongodb://localhost:27017/data'
    const db = new DB(uri)
    TEST.setDB(db)
    TEST.getDB(db => {
      assert.ok(db instanceof Db)
      done()
    })
    TEST.getCollection(col => {
      assert.ok(col instanceof Collection)
      done()
    })
  })
  it('this should successfuly save a doc into database', function(done) {
  })
})

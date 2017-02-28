const assert = require('assert')
const DB = require('../src').DB
const types = require('../src').types
const DOC = require('../src').DOC
const Books1 = require('./books1')
const Books2 = require('./books2')
const ObjectID = require('mongodb').ObjectID
const Db = require('mongodb').Db
const Collection = require('mongodb').Collection


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
      t.save()
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
      t.save()
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
      t.save()
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
      t.save()
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
})

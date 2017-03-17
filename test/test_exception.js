const DOC = require('..').DOC
const DB = require('..').DB
const Int = require('..').types.Int
const Book = require('./Models').Book
const Author = require('./Models').Author
const INSTANCES = require('./instances')
const assert = require('assert')

describe('test for schema violation', function() {
  it('#1.this should throw error when required field not supplied', function() {
    let author = new Author()
    assert.throws(() => {
      let book = new Book({
        author: author,
      })
    }, Error)
  })
  it('#2.this should throw error when copies is not integer', function() {
    assert.throws(() => {
      let book = new Book({
        title: 'title',
        copies: 111.1
      })
    }, Error)
  })
  it('#3.this should throw error when copies doesnot pass custom validator', function() {
    assert.throws(() => {
      let book = new Book({
        title: 'title',
        copies: 90
      })
    },Error)
  })
  it('#4.this should throw error when title is not string', function() {
    assert.throws(() => {
      let book = new Book({
        title: 2666
      })
    }, Error)
  })
  it('#5.this should throw error when author is not Author', function() {
    assert.throws(() => {
      let book = new Book({
        title: '2666',
        author: 'author'
      })
    }, Error)
  })
  it('#6.this should throw error when publish is not Date', function() {
    assert.throws(() => {
      let book = new Book({
        title: '2666',
        publish: Date.now()
      })
    }, Error)
  })
  it('#7.this should throw error when price is not Number', function() {
    assert.throws(() => {
      let book = new Book({
        title: '2666',
        price: '22'
      })
    }, Error)
  })
  it('#8.this should throw error when recommedation is not Object', function() {
    assert.throws(() => {
      let book = new Book({
        title: '2666',
        recommedation: 'greate book'
      })
    }, Error)
  })
  it('#9.this should throw error when keywords is not Array', function() {
    assert.throws(() => {
      let book = new Book({
        title: '2666',
        keywords: 'history'
      })
    }, Error)
  })
  it('#10.this should throw error when keywords array element is not String', function() {
    assert.throws(() => {
      let book = new Book({
        title: '2666',
        keywords: [1]
      })
    }, Error)
  })
  it('#11.this should throw error when soldout is not Boolean', function() {
    assert.throws(() => {
      let book = new Book({
        title: '2666',
        soldout: 1
      })
    }, Error)
  })
  it('#12.this should throw error when unpredefined field used', function() {
    assert.throws(() => {
      let book = new Book({
        title: '2666',
        stars: 5
      })
    }, Error)
  })
  it('#13.this should throw error when data for a [] type is not array', function() {
    class Test extends DOC {
      constructor(data) {
        super(data)
        this.setSchema({
          numbers: []
        })
      }
    }
    assert.throws(() => {
      let t = new Test({numbers: 1})
    }, Error)
  })
  it('#14.this should throw error when multitype constrain in array', function() {
    class Test extends DOC {
      constructor(data) {
        super(data)
        this.setSchema({
          numberAndStr: [Number, String]
        })
      }
    }
    assert.throws(() => {
      let t = new Test({numberAndStr: [1,'s']})
    }, Error)
  })
  it('#15.this should throw error for other schema types', function() {
    class Test extends DOC {
      constructor(data) {
        super(data)
        this.setSchema({
          yes: true
        })
      }
    }
    assert.throws(() => {
      let t = new Test({yes: true})
    }, Error)
  })
  it('#16.this should throw error when saving empty data', function() {
    let uri = 'mongodb://localhost:27017/data'
    let db = new DB(uri)
    class Test extends DOC {
      constructor(db, data) {
        super(db, data)
        this.setSchema({
          name: String,
          age: Int
        })
      }
    }
    let t = new Test(db)
    assert.throws(() => {
      t.save()
    }, Error)
  })
  it('#17.this should throw error when calling update before save', function() {
    let book = new Book()
    assert.throws(() => {
      book.update()
    }, Error)
  })
  it('#18.this shoud throw error when field name is called __data', function() {
    class Test extends DOC {
      constructor(data) {
        super(data)
        this.setSchema({
          __data: Number,
          name: String
        })
      }
    }
    assert.throws(() => {
      let t = new Test()
    }, Error)
  })
})



describe('directly new DOC exception', function() {
  it('#1.this should throw error when directly new DOC class', function() {
    assert.throws(() => {
      let doc = new DOC()
    }, Error)
  })
})
describe('setSchema exception', function() {
  it('#1.unsupported schema field should throw error', function() {
    class Test extends DOC {
      constructor(data) {
        super(data)
        this.setSchema({
          name: {
            unknow: 'unknow'
          }
        })
      }
    }
    assert.throws(() => {
      let t = new Test()
    }, Error)
  })
  it('#2.throw error when argument to setSchema is not a plain object', function() {
    class Test extends DOC {
      constructor(data) {
        super(data)
        this.setSchema('schema')
      }
    }
    assert.throws(() => {
      let t = new Test()
    }, Error)
  })
  it('#3.thorw error when schema filed is object without type defination', function() {
    class Test extends DOC {
      constructor(data) {
        super(data)
        this.setSchema({
          name: {
            required: true
          }
        })
      }
    }
    assert.throws(() => {
      let t = new Test()
    }, Error)
  })
  it('#4.throw error when validator is not function', function() {
    class Test extends DOC {
      constructor(data) {
        super(data)
        this.setSchema({
          age: {
            type: Int,
            validator: true
          }
        })
      }
    }
    assert.throws(() => {
      let t = new Test()
    }, Error)
  })
  it('#5.throw error when unique, sparse is not boolean', function() {
    class Test extends DOC {
      constructor(data) {
        super(data)
        this.setSchema({
          age: {
            type: Int,
            unique: 1,
          }
        })
      }
    }
    assert.throws(() => {
      let t = new Test()
    }, Error)
  })
})
describe('wrongly construct new instance exception', function() {
  it('this should throw error when argu to class is not plain obj', function() {
    assert.throws(() => {
      let book = new Book('2666')
    }, Error)
  })
})
describe('wrong argument to super exception', function() {
  it('this should throw error when unproperly calling super', function() {
    class Test1 extends DOC {
      constructor() {
        super()
        this.setSchema({
          number: Int
        })
      }
    }
    class Test2 extends DOC {
      constructor(arg) {
        super(arguments[0],arguments[1],arguments[2])
        this.setSchema({
          number: Int
        })
      }
    }
    let db = new DB('mongodb://localhost:27018/data')
    class Test3 extends DOC {
      constructor(db, data) {
        super(db,data)
        this.setSchema({
          number: Int
        })
      }
    }
    assert.throws(() => {
      let test1 = new Test1()
    }, Error)
    assert.throws(() => {
      let test2 = new Test2(1,2,3)
    }, Error)
    assert.throws(() => {
      let test3 = new Test3({number: 1}, db)
    }, Error)
    assert.throws(() => {
      let test4 = new Test3(db, 'notAPlainObject')
    }, Error)
  })
})
describe('db exception', function() {
  it('#1.this should throw error when failed to connect to db', function(done) {
    let uri = 'mongodb://localhost:27018/data'
    let db = new DB(uri)
    assert.throws(() => {
      db.getDB()
      done()
    }, Error)
  })
  it('#2.this should throw error when call class method getCollection/getDB without db set', function() {
    class Test extends DOC {
      constructor(db, data) {
        super(db, data)
        this.setSchema({
          name: String,
          age: Int
        })
      }
    }
    assert.throws(() => {
      Test.getCollection()
    }, Error)
    assert.throws(() => {
      Test.getDB()
    }, Error)
  })
})
describe('class method exception', function() {
  class Test extends DOC {
    constructor(data) {
      super(data)
      this.setSchema({
        _id: Number,
        name: String,
        age: Int,
        canDrinkBeer: {
          type: Boolean,
          required: true
        },
        friends: [String],
        hoby: {
          type: Object,
          unique: true
        }
      })
    }
  }
  Test.fireUp()
  it('#1.this should throw error when unknown data supplied', function() {
    assert.throws(() => {
      Test.checkData({name: 'name', age: 1, like: 'apple'})
    }, Error)
  })
  it('#2.this should throw error when data does\'t meet schema defination', function() {
    assert.throws(() => {
      Test.checkData({_id: 1, name: 'name', age: 11, canDrinkBeer: 0})
    }, Error)
  })
  it('#3.this should throw error for deprecated $pullAll update operator', function() {
    assert.throws(() => {
      Test.checkUpdateData({$pushAll: {friends: 'XiaoHong'}})
    }, Error)
  })
  it('#4.this should throw error when nested update used', function() {
    assert.throws(() => {
      Test.checkUpdateData({$set:{'hoby.name': 'football'}}, 'one')
    }, Error)
  })
  it('#5.this should throw error when $set used for updateMany but has unique constrain', function() {
    assert.throws(() => {
      Test.checkUpdateData({$set: {hoby: 'hoby'}}, 'many')
    }, Error)
  })
  it('#6.this should throw error when $unset a nested field', function() {
    assert.throws(() => {
      Test.checkUpdateData({$unset: {'canDrinkBeer.a': "1"}}, 'one')
    }, Error)
  })
  it('#6.this should throw error when $unset a required field', function() {
    assert.throws(() => {
      Test.checkUpdateData({$unset: {canDrinkBeer: ""}}, 'one')
    }, Error)
  })
  it('#7.this should throw error when $setOnInsert a nested field', function() {
    assert.throws(() => {
      Test.checkUpdateData({$setOnInsert:{'name.a': 'a'}})
    }, Error)
  })
  it('#8.this should throw error when $setOnInsert a unique field for updateMany', function() {
    assert.throws(() => {
      Test.checkUpdateData({$setOnInsert:{hoby: 'football'}}, 'many')
    }, Error)
  })
  it('#9.this should throw error when $currentDate a unique field for updateMany', function() {
    assert.throws(() => {
      Test.checkUpdateData({$currentDate:{hoby: true}}, 'many')
    }, Error)
  })
  it('#10.this should throw error when $push a nested field', function() {
    assert.throws(() => {
      Test.checkUpdateData({$push:{'name.a': 'a'}})
    }, Error)
  })
  it('#11.this should throw error when calling class\'s insert method which is deprecated', function() {
    assert.throws(() => {
      Book.insert()
    }, Error)
  })
  it('#12.this should throw error when deprecated update operator used for upateOne', function() {
    class Test extends DOC {
      constructor(data) {
        super(data)
        this.setSchema({
          title: String,
          copies: Int
        })
      }
    }
    let uri = 'mongodb://localhost:27017/data'
    let db = new DB(uri)
    Test.setDB(db)
    assert.throws(() => {
      Test.updateOne({copies: 1000}, {$inc: {copies: 100}})
    }, Error)
  })
  it('#13.this should throw error when deprecated findAndModify used', function() {
    assert.throws(() => {
      Book.findAndModify()
    }, Error)
  })
  it('#14.this should throw error when remove findAndModify used', function() {
    assert.throws(() => {
      Book.remove()
    }, Error)
  })
  it('#15.this should throw error when remove findAndRemove used', function() {
    assert.throws(() => {
      Book.findAndRemove()
    }, Error)
  })
})

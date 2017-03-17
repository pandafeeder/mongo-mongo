const AuthorCURD = require('./Models').AuthorCURD
const BookCURD = require('./Models').BookCURD
const AuthorCURD2 = require('./Models').AuthorCURD2
const BookCURD2 = require('./Models').BookCURD2
const assert = require('assert')
const ObjectID = require('mongodb').ObjectID 
const INSTANCES = require('./instances')
const DOC = require('..').DOC
const Int = require('..').types.Int
const DB = require('..').DB
const Cursor = require('mongodb').Cursor
const MongoDB = require('mongodb').Db

describe('Test for all CURD operations', function() {
  before(function(done) {
    let db = new DB('mongodb://localhost:27017/data')
    db.getDB(db => db.dropDatabase().then(r => {
      console.log('before: database data dropped')
      done()
    }))
  })
describe('instance\'s CURD operation', function() {
  describe('test for CREATE and UPDATE', function() {
    let db = new DB('mongodb://localhost:27017/data')
    let author = new AuthorCURD({
      name: 'Roberto',
      born: new Date(1953,3,27),
      nationality: ['Chile'],
      married: true
    })
    let book = new BookCURD({
      title: '2666',
      author: author,
      publish: new Date(2008,10,10),
      price: 12.2,
      copies: 1500,
      recommedation: {
        reviewer: 'New York Times',
        comment: '1 Best Books of 2008'
      },
      keywords: ['history', 'novel'],
      soldout: true
    })
    BookCURD.setDB(db)
    describe('for instance, the only method for CREATE is save', function() {
      it('#1.this should successfully create a book doc in db: data/books_curd', function(done) {
        book.save()
          .then(r => {
            assert.equal(r.result.ok, 1)
            assert.equal(r.insertedCount, 1)
            done()
          })
      })
    })
    describe('for instance, the only method for UPDATE is update', function() {
      it('#1.this should successfully update book\'s price to 18.2', function(done) {
        book.price = 18.2
        book.update()
          .then(r => {
            assert.ok(r.modifiedCount === 1)
            done()
          })
      })
      it('#2.this should successfully update nested author field', function(done) {
        book.author.name = 'Roberto Bolañ'
        book.update()
          .then(r => {
            assert.ok(r.result.ok === 1)
            done()
          })
      })
      it('#3.this should successfully update none embedded and embedded field at the same time', function(done) {
        book.price = 16.2
        author.name = 'Roberto Bolaño'
        book.update()
          .then(r => {
            assert.ok(r.result.ok === 1)
            done()
          })
      })
      it('#4.after calling save for the first time, afterward save should have the same effect as update', function(done) {
        book.price = 15.2
        book.save()
          .then(r => {
            assert.ok(r.result.ok === 1)
            done()
          })
      })
      it('#5.addData should successfully add data, then calling save() to save or update() to update', function(done) {
        let book2 = new BookCURD()
        book2.addData({
          title: 'Last Evenings on Earth',
          author: author,
          publish: new Date(2007,3,30),
          copies: 1000,
          price: 9.85,
          keywords: ['novel'],
        })
        book2.save()
          .then(r => {
            assert.ok(r.result.ok === 1)
            done()
          })
      })
      it('#6.for Object field, you have to assign a new obj to update', function(done) {
        book.recommedation = 
        {
          reviewer: 'New York Times',
          comment: '10 Best Books of 2008'
        }
        book.update()
          .then(r => {
            assert.ok(r.result.ok === 1)
            done()
          })
      })
    })
    describe('test for READ, for instance read data just through accssor descriptor', function() {
      it('test for getter property, the following should be equal', function() {
        assert.equal(book.title, '2666')
        assert.equal(book.price, 15.2)
        assert.equal(book.copies, 1500)
        assert.deepEqual(book.keywords, ['history','novel'])
        assert.deepEqual(book.recommedation,
            {
              reviewer: 'New York Times',
              comment: '10 Best Books of 2008'
            }
        )
        assert.equal(book.soldout, true)
        assert.equal(book.author, author)
      })
    })
    describe('test for DELETE', function() {
      it('this should successfully delete doc in database using instance delete method', function(done) {
        book.delete()
          .then( r => {
            assert.ok(r.result.ok === 1)
            done()
          })
      })
    })
  })
})

describe('class\'s CURD operation', function() {
  //if no instance constructed, use class method fireUp
  BookCURD2.fireUp()
  let db = new DB('mongodb://localhost:27017/data')
  BookCURD2.setDB(db)
  let author = new AuthorCURD2({
    name: 'Roberto',
    born: new Date(1953,3,27),
    nationality: ['Chile'],
    married: true
  })
  it('#0.class method getDB shoulde return db instance', function(done) {
    BookCURD2.getDB(db => {
      assert.ok(db instanceof MongoDB)
      done()
    })
  })
  it('#1.class method insertOne should have the ability to check data sanity', function() {
    assert.throws(() => {
      BookCURD2.insertOne(
        {
          title: '2666',
          publish: new Date(2008,10,10),
          price: 15.2,
          copies: 5000
        }
      )
    }, Error)
  })
  it('#2.class method insertOne should have the ability to check data sanity', function() {
    assert.throws(() => {
      BookCURD2.insertOne(
        {
          title: 2666,
          publish: new Date(2008,10,10),
          price: 15.2,
          copies: 1000
        }
      )
    }, Error)
  })
  it('#3.class method insertOne should have the ability to check data sanity and insert a doc', function(done) {
   BookCURD2.insertOne(
      {
        title: '2666',
        publish: new Date(2008,10,10),
        price: 15.2,
        copies: 1000,
        author: author
      }
    ).then(r => {
      assert.ok(r.result.ok === 1)
      done()
    })
  })
  it('#4.class method insertMany should have the ability to check data sanity', function() {
    assert.throws(() => {
      BookCURD2.insertMany([
          {title: 'title1', price: 19, copies: 500},
          {title:  2666, price: 20, copies: 500},
      ])
    }, Error)
  })
  it('#5.class method insertMany should have the ability to check data sanity', function() {
    assert.throws(() => {
      BookCURD2.insertMany([
          {title: 'title1', price: 19, copies: 500},
          {title: 'title2', price: 20.2, copies: 5000},
      ])
    }, Error)
  })
  it('#6.class method insertMany should have the ability to check data sanity and insert many docs', function(done) {
    BookCURD2.insertMany([
        {title: 'title1_insertMany', price:18, author: author, copies:1000, recommedation:{r1: 'r1'}},
        {title: 'title2_insertMany', price:19, author: author, copies:1500, recommedation:{r2: 'r2'}},
        {title: 'title3_insertMany', price:20, author: author, copies:1600, recommedation:{r3: 'r3'}},
        {title: 'title3_extra',      price:21, author: author, copies:1700, recommedation:{r4: 'r4'}}
    ]).then( r => {
      assert.ok(r.insertedCount === 4)
      done()
    })
  })
  it('#7.class method insertOneNative just call native\'s insertOne, no data checking', function(done) {
    BookCURD2.insertOneNative({
      title: 'title_native',
      price: 22,
      copies: 5000,
    }).then(r => {
      assert.ok(r.result.ok === 1)
      done()
    })
  })
  it('#8.class method insertManyNative just call native\'s insertMany, no data checking', function(done) {
    BookCURD2.insertManyNative([
        {title: 'title1_native', price:18, author: author.__data, copies:5000, recommedation:{r1: 'r1'}},
        {title: 'title2_native', price:19, author: author.__data, copies:1500, recommedation:{r2: 'r2'}},
        {title: 'title3_native', price:20, author: author.__data, copies:1600, recommedation:{r3: 'r3'}}
    ]).then( r => {
      assert.ok(r.insertedCount === 3)
      done()
    })
  })
  it('#9.class method replaceOne should have the ability to check data sanity', function() {
    assert.throws(() => {
      BookCURD2.replaceOne({title: 'title_native'}, 
        {
          title: 'title_native_replaceOne',
          price: 22,
          copies: 5000
        }
      )
    }, Error)
  })
  it('#10.class method replaceOne should have the ability to check data sanity and replace a doc successfully', function(done) {
      BookCURD2.replaceOne({title: 'title_native'}, 
        {
          title: 'title_native_replaceOne',
          price: 23,
          copies: 800
        }
      ).then( r => {
        assert.ok(r.result.ok === 1)
        done()
      })
  })
  it('#11.class method updateOne should have the ability to check data sanity', function() {
    assert.throws(() => {
      BookCURD2.updateOne(
          {title: 'title1'},
          {$set: {price: 25, copies: 2100}}
      )
    }, Error)
  })
  it('#11.class method updateOne should have the ability to check data sanity and updateOne doc', function(done) {
    BookCURD2.updateOne(
        {title: 'title1_insertMany'},
        {$set: {price: 25, copies: 1900}}
    ).then(r => {
      assert.ok(r.result.ok === 1)
      done()
    })
  })
  it('#12.class method updateMany should have the ability to chech data sanity', function() {
    assert.throws(() => {
      BookCURD2.updateMany(
          {title: /native/},
          {$set: {price:25, copies:3000}}
      )
    }, Error)
  })
  it('#13.class method updateMany should have the ability to chech data sanity and updateMany docs', function(done) {
    BookCURD2.updateMany(
        {title: /native/},
        {$set: {price:25, copies:1900}}
    ).then(r => {
      assert.ok(r.result.ok === 1)
      done()
    })
  })
  it('#14.class method replaceOneNative just call native function, no data checking', function(done) {
    BookCURD2.replaceOneNative(
        {title: 'title_native_replaceOne'},
        {title: 'title_native_replaceOne_replaceOneNative', copies:5000, price:100}
    ).then(r => {
      assert.ok(r.result.ok === 1)
      done()
    })
  })
  it('#15.class method updateOneNative just call native function, no data checking', function(done){
    BookCURD2.updateOneNative(
        {title: '26666'},
        {$set: {copies: 3000}}
    ).then(r => {
      assert.ok(r.result.ok === 1)
      done()
    })
  })
  it('#16.class method updateManyNative just call native function, no data checking', function(done) {
    BookCURD2.updateManyNative(
        {title: /native/},
        {$set: {copies: 10000}}
    ).then(r => {
      assert.ok(r.result.ok === 1)
      done()
    })
  })
  it('#17.class method findOneAndReplace should have the ability to check data sanity', function() {
    assert.throws(() => {
      BookCURD2.findOneAndReplace(
          {title: 'title_native_replaceOne_replaceOneNative'},
          {title: 'title_native_replaceOne_replaceOneNative_findOneAndReplace', copies:5000}
      )
    }, Error)
  })
  it('#18.class method findOneAndReplace should have the ability to check data sanity and replace doc, return doc directly', function(done) {
    BookCURD2.findOneAndReplace(
        {title: 'title_native_replaceOne_replaceOneNative'},
        {title: 'title_native_replaceOne_replaceOneNative_findOneAndReplace', copies:1999}
    ).then(r => {
      assert.ok(r.title === 'title_native_replaceOne_replaceOneNative')
      done()
    })
  })
  it('#19.class method findOneAndUpdate should have the ability to check data sanity', function() {
    assert.throws(() => {
      BookCURD2.findOneAndUpdate(
          {title: '2666'},
          {$set: {copies: 10000}}
      )
    }, Error)
  })
  it('#20.class method findOneAndUpdate should have the ability to check data sanity and update doc, return doc directly', function(done) {
    BookCURD2.findOneAndUpdate(
        {title: '2666'},
        {$set: {copies: 1999}}
    ).then(r => {
      assert.ok(r.copies === 1000)
      done()
    })
  })
  it('#21.class method findOneAndReplaceNative just call native function, no data checking', function(done) {
    BookCURD2.findOneAndReplaceNative(
        {title: 'title_native_replaceOne_replaceOneNative_findOneAndReplace'},
        {title: 'title_native_replaceOne_replaceOneNative_findOneAndReplace_findOndAndReplaceNative', copies:10000, price:100}
    ).then(r => {
      assert.ok(r.value.title === 'title_native_replaceOne_replaceOneNative_findOneAndReplace')
      done()
    })
  })
  it('#22.class method findOneAndUpdateNative just call native function, no data checking', function(done) {
    BookCURD2.findOneAndUpdateNative(
        {title: 'title_native_replaceOne_replaceOneNative_findOneAndReplace_findOndAndReplaceNative'},
        {$set: {copies:10001, price:101}}
    ).then(r => {
      assert.ok(r.value.copies === 10000)
      done()
    })
  })
  it('#23.class method findOne should return matched doc', function(done) {
    BookCURD2.findOne(
        {title: '2666'}
    ).then(obj => {
      assert.ok(obj.title === '2666')
      done()
    })
  })
  it('#24.class method findOneNative is the same as findOne', function(done) {
    BookCURD2.findOneNative(
        {title: '2666'}
    ).then(obj => {
      assert.ok(obj.title === '2666')
      done()
    })
  })
  it('#25.class method find should return a mongo cursor', function(done) {
    BookCURD2.find(
        {title: '2666'}
    ).then(cursor => {
      assert.ok(cursor instanceof Cursor)
      done()
    })
  })
  it('#26.class method deleteOne should successfully delete a matched doc', function(done) {
    BookCURD2.deleteOne(
        {title: 'title3_native'}
    ).then(r => {
      assert.ok(r.result.ok === 1)
      done()
    })
  })
  it('#27.class method deleteOneNative is the same as deleteOne', function(done) {
    BookCURD2.deleteOneNative(
        {title: 'title2_native'}
    ).then(r => {
      assert.ok(r.result.ok === 1)
      done()
    })
  })
  it('#28.class method deleteMany should successfully delete many matched docs', function(done) {
    BookCURD2.deleteMany(
        {title: /native/}
    ).then(r => {
      assert.ok(r.result.ok === 1)
      done()
    })
  })
  it('#29.class method deleteManyNative is the same as deleteMany', function(done) {
    BookCURD2.deleteManyNative(
        {title: /insertMany/}
    ).then(r => {
      assert.ok(r.result.ok === 1)
      done()
    })
  })
  it('#30.class method findOneAndDelete should successfully delete a matched doc, return doc directly', function(done) {
    BookCURD2.findOneAndDelete(
        {title: '2666'}
    ).then(r => {
      assert.ok(r.title === '2666')
      done()
    })
  })
  it('#31.class method findOneAndDeleteNative just call native findOneAndDelete', function(done) {
    BookCURD2.findOneAndDeleteNative(
        {title: /extra/}
    ).then(r => {
      assert.ok(r.value.title === 'title3_extra')
      done()
    })
  })
})
})

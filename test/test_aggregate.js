const DB = require('..').DB
const DOC = require('..').DOC
const assert = require('assert')
const MongoError = require('mongodb').MongoError

describe('Test for aggregation functions', function() {
  let db = new DB('mongodb://localhost:27017/agg')
  class Phone extends DOC {
    constructor(data) {
      super(data)
      this.setSchema({
        _id: Number,
        components: Component,
        display: String
      })
    }
    static setCollectionName() {
      return 'phones'
    }
  }
  class Component extends DOC {
    constructor(db, data) {
      super(db, data)
      this.setSchema({
        country: Number,
        area: Number,
        prefix: Number,
        number: Number
      })
    }
  }
  Phone.fireUp()
  Phone.setDB(db)

  before(function(done) {
    db.getDB(db => db.dropDatabase().then(r => {
      console.log('before: database agg dropped')
      done()
    }))
  })

  it('populate docs first', function(done) {
    this.timeout(5000)
    db.getDB(db => {
      let many = []
      for (let i = 66660000; i < 66670000; i++) {
        let country = 1 + Math.floor(Math.random()*100)
        let num = (country*1e10) + 21*1e7 + i
        many.push({
          _id: num,
          components: {
            country: country,
            area: 21,
            prefix: (i * 1e-4) << 0,
            number: i
          },
          display: "+" + country + " " + 21 + "-" + i
        })
      }
      db.collection('phones').insertMany(many).then( r => {
        done()
      })
    })
  })

  it('#1.test for aggregate, it just calls native\'s aggregate', function(done) {
    this.timeout(5000)
    Phone.aggregate(
        [
          {$match: {'components.area': 21}},
          {$group: {_id:'$components.prefix', total: {$sum: 1}}}
        ]
    ).then(r => {
      assert.deepEqual(r, [{_id: 6666, total: 10000}])
      done()
    })
  })
  it('#1.0.1.test for aggregate reject error branch', function(done) {
    Phone.aggregate(
        'aggregate'
    ).catch(e => {
      assert.ok(e instanceof MongoError)
      done()
    })
  })
  it('#1.1.aggregate with option cursor, should return a cursor', function(done) {
    Phone.aggregate(
        [
        {$match: {'components.area': 21}},
        {$group: {_id: '$components.prefix', total: {$sum: 1}}}
        ],
        {cursor: {batchSize: 1}}
    ).then(cursor => {
      cursor.toArray((err, doc) => {
        assert.deepEqual(doc, [{_id: 6666, total: 10000}])
        done()
      })
    })
  })
  it('#1.1.1.test for aggregate with option cursor, error can be caught is cursor\'s callback', function(done) {
    this.timeout(5000)
    Phone.aggregate(
        ['match', 'group'],
        {cursor: {batchSize: 1000}}
    ).then(cursor => {
        cursor.toArray((err, result) => {
          assert.ok(err instanceof MongoError)
          done()
    })})
  })
  it('#1.2.test for aggregate with none cursor option', function(done) {
    Phone.aggregate(
        [
        {$match: {'components.area': 21}},
        {$group: {_id: '$components.prefix', total: {$sum: 1}}}
        ],
        {maxTimeMS: 1000}
    ).then(r => {
        assert.deepEqual(r, [{_id: 6666, total: 10000}])
        done()
    })
  })
  it('#1.2.1.test for aggregate with none cursor option reject error branch', function(done) {
    Phone.aggregate(
        'wrong argument',
        {maxTimeMS: 1000}
    ).catch(e => {
      assert.ok(e instanceof MongoError)
      done()
    })
  })
  it('#2.test for mapReduce, it just calls native\'s mapReduce', function(done) {
    Phone.mapReduce(
      function() {emit(this.components.area, this.components.prefix)},
      function(key, values) {return 1},
      {
        query: {'components.area': 21},
        out: "totals"
      }
    ).then( r => {
      done()
    })
  })
  it('#2.1.test for mapReduce reject error branch', function(done) {
    Phone.mapReduce(
      'mapfunction',
      'reducefunction',
      {
        query: {'components.area': 21},
        out: "totals"
      }
    ).catch(e => {
      assert.ok(e instanceof MongoError)
      done()
    })
  })
  it('#3.test for count, it just calls native\'s count', function(done) {
    this.timeout(5000)
    Phone.count({}).then(r => {
      assert.equal(r, 10000)
      done()
    })
  })
  //
  //it('#3.1.test for count reject error branch', function(done) {
  //  Phone.count([1,2,3]).catch(e => {
  //    console.log(e)
  //    assert.ok(e instanceof MongoError)
  //    done()
  //  })
  //  .then(r => {console.log(r); done()})
  //})
  it('#4.test for distinct, it just calls native\'s aggregate', function(done) {
    Phone.distinct('components.area').then(r => {
      assert.deepEqual(r, [21])
      done()
    })
  })
  it('#4.1.test for distict reject error branch', function(done) {
    Phone.distinct({wrongarg:1}).catch(e => {
      assert.ok(e instanceof MongoError)
      done()
    })
  })
  it('#5.test for bulkWrite, it just calls native\'s bulkWrite', function(done) {
    Phone.bulkWrite([
        {insertOne: {document: {a:1}}},
        {insertOne: {document: {a:2}}}
    ]).then(r => {
      assert.ok(r.ok === 1)
      done()
    })
  })
  it('#5.1.test for bulkWrite reject error branch', function(done) {
    Phone.bulkWrite([
        'wrong argument'
    ]).catch(e => {
      assert.ok(e instanceof MongoError)
      done()
    })
  })
})

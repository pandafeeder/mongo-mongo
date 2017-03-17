const DB = require('..').DB
const DOC = require('..').DOC
const assert = require('assert')

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
    constructor(data) {
      super(data)
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
  it('#3.test for count, it just calls native\'s count', function(done) {
    Phone.count({}).then(r => {
      assert.equal(r, 10000)
      done()
    })
  })
  it('#4.test for distinct, it just calls native\'s aggregate', function(done) {
    Phone.distinct('components.area').then(r => {
      assert.deepEqual(r, [21])
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
})

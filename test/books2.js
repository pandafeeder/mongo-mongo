'use strict'
const DB = require('..').DB
const types = require('..').types
const DOC = require('..').DOC
const uri = 'mongodb://localhost:27017/data'
const db = new DB(uri)

class Books2 extends DOC{
  constructor(data) {
    super(db, data)
    this.setSchema({
      title : {
        type: String,
        unique: true,
        sparse: true,
      },
      author : String,
      publish : {
        type: Date,
        unique: true,
        required: true,
      },
      price : {
        type: types.Float,
        validator: v => {
          return v > 10 && v < 100
        },
        sparse: true
      },
      brought : {
        type: Boolean,
        required: true,
        default: false,
        sparse: true,
      },
      keywords : [String]
    })
  }
  static setCollectionName() {
    return 'books2'
  }
}

module.exports = exports = Books2

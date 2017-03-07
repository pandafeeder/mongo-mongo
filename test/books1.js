'use strict'
const DB = require('..').DB
const types = require('..').types
const DOC = require('..').DOC

class Books1 extends DOC{
  constructor(data) {
    super(data)
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
      copies: types.Int,
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
    return 'books1'
  }
}

module.exports = exports = Books1

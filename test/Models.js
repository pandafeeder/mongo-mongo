const DOC = require('..').DOC
const Int = require('..').types.Int

//default collection name for a class is its lower-cased name
//for Author, its collection name is author
class Author extends DOC {
  constructor(data) {
    super(data)
    this.setSchema({
      name: {type: String, required: true},
      born: Date,
      nationality: [String],
      married: Boolean
    })
  }
}
class AuthorCURD extends DOC {
  constructor(data) {
    super(data)
    this.setSchema({
      name: {type: String, required: true},
      born: Date,
      nationality: [String],
      married: Boolean
    })
  }
}


class Book extends DOC {
  constructor(data) {
    super(data)
    this.setSchema({
      title: {type: String, required: true},
      //embedded document
      author: 'Author',
      publish: Date,
      created: {type: Date, default: new Date()},
      price: Number,
      copies: {type: Int, validator: v => (v>100 && v<2000)},
      //embedded document of plain object
      recommedation: {type: Object, unique: true, sparse: true},
      keywords: [String],
      soldout: Boolean,
    })
  }
  static setCollectionName() {
    return 'books'
  }
}
class BookCURD extends DOC {
  constructor(data) {
    super(data)
    this.setSchema({
      title: {type: String, required: true},
      //embedded document
      author: 'AuthorCURD',
      publish: Date,
      created: {type: Date, default: new Date()},
      price: Number,
      copies: {type: Int, validator: v => (v>100 && v<2000)},
      //embedded document of plain object
      recommedation: {type: Object, unique: true, sparse: true},
      keywords: [String],
      soldout: Boolean,
    })
  }
  static setCollectionName() {
    return 'books_curd'
  }
}

class BookCURD2 extends DOC {
  constructor(data) {
    super(data)
    this.setSchema({
      title: {unique: true, type: String, required: true},
      //embedded document
      author: 'AuthorCURD2',
      publish: Date,
      created: {type: Date, default: new Date()},
      price: Number,
      copies: {type: Int, validator: v => (v>100 && v<2000)},
      //embedded document of plain object
      recommedation: {type: Object, sparse: true},
      keywords: [String],
      soldout: Boolean,
    })
  }
  static setCollectionName() {
    return 'books_curd2'
  }
}
class AuthorCURD2 extends DOC {
  constructor(data) {
    super(data)
    this.setSchema({
      name: {type: String, required: true},
      born: Date,
      nationality: [String],
      married: Boolean
    })
  }
}


module.exports = exports = {
  Author: Author,
  Book: Book,
  AuthorCURD: AuthorCURD,
  BookCURD: BookCURD,
  AuthorCURD2: AuthorCURD2,
  BookCURD2: BookCURD2,
}

const Book = require('./Models').Book
const Author = require('./Models').Author

let author1 = new Author({
  name: 'Roberto Bolaño',
  born: new Date(1953,3,27),
  nationality: ['Chile'],
  married: true
})
let author2 = new Author()

let book1 = new Book({
  title: '2666',
  author: author1,
  publish: new Date(2008,10,10),
  price: 15.2,
  copies: 1500,
  recommedation: {
    reviewer: 'New York Times',
    comment: '10 Best Books of 2008'
  },
  keywords: ['history', 'novel'],
  soldout: true
})
let book2 = new Book()

const INSTANCES = {
  author1: author1,
  author2: author2,
  book1: book1,
  book2: book2,
}


module.exports = exports = INSTANCES

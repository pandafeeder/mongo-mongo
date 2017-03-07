'ues strict'
const DOC = require('..').DOC

class Address extends DOC {
  constructor(data) {
    super(data)
    this.setSchema({
      country: String,
      city: String,
      zip: types.Int
    })
  }
}


class Person extends DOC {
  constructor(data) {
    super(data)
    this.setSchema({
      name: String,
      address: 'Address',
      extra: Object
    })
  }
}

[![build status](https://img.shields.io/travis/pandafeeder/mongo-mongo/master.svg?style=flat-square)](https://travis-ci.org/pandafeeder/mongo-mongo)
[![npm version](https://img.shields.io/npm/v/mongo-mongo.svg?style=flat-square)](https://www.npmjs.com/package/mongo-mongo)
[![Coverage Status](https://coveralls.io/repos/github/pandafeeder/mongo-mongo/badge.svg?branch=master)](https://coveralls.io/github/pandafeeder/mongo-mongo?branch=master)

# __A ES6 class based mongoDB ODM__ *which is a wrapper upon offical mongodbjs driver, inspired by Django db*

### features
- Object oriented
- schema constrain
- promise based
- decorated class mehod
- native driver function exposed

## required
node version >= 6
## installation
```npm install --save mongo-mongo```
## content
- <a href="#db-class">DB class</a>
- <a href="#schema-defination">schema defination</a>
- <a href="#instance-method">instance method</a>
- <a href="#class-method">class method</a>
- <a href="#native-driver-functions">native driver functions</a>
- <a href="#edge-cases">edge cases</a>

## a quick glance
```javascript
const { DOC, DB, types } = require('mongo-mongo')
class Book extends DOC {
    constructor(data) {
        super(data)
        this.setSchema({
            title: {type: String, unique: true},
            publish: Date,
            created: {type: Date, default: new Date},
            copies: {
                type: types.Int,
                validator: v => (v >= 1000 && v <= 10000)
            }
            price: Number
        })
    }
    static setCollectionName() {
        return 'books'
    }
}
const db = new DB('mongodb://localhost:27017/db')
Book.setDB(db)
let book = new Book({title:'2666', publish: new Date(2008,10,10), copies: 5000, price: 12.2})
book.save()
    .then(r => {console.log('saved!')})
    .catch(e => {console.log('something wrong when saving')})

book.price = 15.2
book.update()
    .then(r => {console.log('updated!')})
    .catch(e => {console.log('something wrong when updating')})

```



## CURD operation
| operatrion | instance | class | native driver |
| ------ | ------ | ------ | ----- |
| Create |  save  | insertOne | insertOneNative |
| Update |  setter + update | updateOne | updateOneNative |
| Read   |  getter | findOne | findOneNative |
| Delete |  delete | deleteOne | deleteOneNative |

## DB class

## schema defination

## instance method

## class method

## native driver functions

## edge cases


when new without arguments, default value will still be valid

multi nested

you have to assign new object for Object field to trigger \_\_updatedField

insertManyNative embedded doc

adopted class method only have the ability to check argument data

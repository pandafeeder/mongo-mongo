[![build status](https://img.shields.io/travis/pandafeeder/mongo-mongo/master.svg?style=flat-square)](https://travis-ci.org/pandafeeder/mongo-mongo)
[![npm version](https://img.shields.io/npm/v/mongo-mongo.svg?style=flat-square)](https://www.npmjs.com/package/mongo-mongo)
[![Coverage Status](https://coveralls.io/repos/github/pandafeeder/mongo-mongo/badge.svg?branch=master)](https://coveralls.io/github/pandafeeder/mongo-mongo?branch=master)

# __A ES6 class based mongoDB ODM__ *which is a wrapper upon offical mongodbjs driver*

### features
- Object based: *an object representing a document in collection, with CRUD methods and all data fields are setter and getter accessor descriptors.*
- schema: *support multi constrain like type, unique, sparse, default, required and you can customize an validator function for a field*
- promise based: *all operation return promise.*
- decorated class mehod: *class methods expose all CRUD operations with additional customization as data checking against schema defination and directly return doc for __findOneAndRepacle__ __findOneAndUpdate__ __findOneAndDelete__ instead of a result (which you have to use result.value to get the doc in native way).*
- native driver function exposed: *you can also directly use offical driver's function via class methods whose name appended by Native or use constructed db instance from DB class*

### required
node version >= 6
### installation
```npm install --save mongo-mongo```
### content
- <a href="#a-quick-glance">a quick glance</a>
- <a href="#db-class">DB class</a>
- <a href="#constructor">constructor</a>
- <a href="#schema-defination">schema defination</a>
- <a href="#instance-method">instance method</a>
- <a href="#class-method">class method</a>
- <a href="#native-driver-functions">native driver functions</a>
- <a href="#edge-cases">edge cases</a>
- <a href="#crud-operation">CRUD operation</a>
- <a href="#todo">Todo</a>
### a quick glance
```javascript
const { DOC, DB, types } = require('mongo-mongo')

class Book extends DOC {
    constructor(data) {
        super(data)
        this.setSchema({
            title: {type: String, unique: true},
            // if only type constrain, use this syntax for short
            publish: Date,
            created: {type: Date, default: new Date},
            copies: {
                type: types.Int,
                validator: v => (v >= 1000 && v <= 10000)
            }
            price: Number
        })
    }
    // default collection name is lower-cased class name, set it explicitly using below method
    static setCollectionName() {
        return 'books'
    }
}

// DB eats the same argument as native's MongoClient.connect
const db = new DB('mongodb://localhost:27017/db')
// all CURD operation will use the same db instance
Book.setDB(db)
// no created supplied, a default new Date will be used
let book = new Book({title:'2666', publish: new Date(2008,10,10), copies: 5000, price: 12.2})
// insert data into database
book.save()
    .then(r => {console.log('saved!')})
    .catch(e => {console.log('something wrong when saving')})
```


### DB class
Constructed with a mongo connect string and option, it's a wrapper upon native driver's MongoClient. Once a instance is constructed, you can get native driver's db instance via ```db.getDB(db => console.log('db is a instance of native MongoDb'))```. The point is getDB returns a thunker which delays the evaluation of a paramless async function and cache the result(thanks to thunky module), that's to say for a specific db instande, it's connected to db server only once, and the afterwards calling just reuse the same db instance.
###### example:
```javascript
const DB = require('mongo-mongo').DB
const db = new DB('mongodb://localhost:27017/data')
db.getDB(db => {}) //do whatever you want with db inside arrow function
```

### constructor
You can use constructor in two ways:
1. only pass data argument and set db to be used later via class method setDB
2. pass both db and data arguments

both ways support constructing with no argument and set latter
###### example:
```javascript
//1. only pass data to constructor
class YourDOC1 extends DOC {
    constructor(data) {
        super(data)
        this.setSchema({name: String})//define your schema here
    }
}
//2. pass db and data to construcotr
class YourDOC2 extends DOC {
    constructor(db, data) {
        super(db, data)
        this.setSchema({name: String})//define your schema here
    }
}

//new instance with argument
let yourdoc1 = new YourDOC1({name: 'name'}); YourDOC1.setDB(db);
//laterly newed instance after yourdoc2 don't need db anymore since you've set at first time
let yourdoc2 = new YourDOC2(db, {name: 'name'})

//new instance without argument and set data/db latter
let yourdoc1_1 = new YourDOC1(); YourDOC1.setDB(db);
let yourdoc2_1 = new YourDOC2(); YourDOC2.setDB(db);
yourdoc1_1.name = 'name'
yourdoc2_1.name = 'name'
```

### schema defination
set schema inside constructor via ```this.setSchema({})//schma object```
###### supported types: 
- String
- Number
- Int: *you need to import types and refer Int by types.Int ```const Int = require('mongo-mongo').types.Int```*
- Object
- Boolean
- Array
- Date
- nested document
###### example for nested document
```javascript
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

let author = new Author({
  name: 'Roberto Bolaño',
  born: new Date(1953,3,27),
  nationality: ['Chile'],
  married: true
})

let book = new Book({
  title: '2666',
  author: author,
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
```
 
###### supported constrains:
- type: define a field's type, if you only want type constrain, use *fieldName: TYPE* for short
- unique: this will create a index by calling mongodb's native ```createIndex('yourFieldName', {unique: true})``` once for a DOC class
- default: when no value supplied, default will be used
- required: throw error when construct a new instance with data argument without required field or throw error when calling save if you construct instance without data argument
- sparse: this will create a index by calling mongodb's native ```createIndex('yourFieldName', {sparse: true})``` once for a DOC class
- validator: this must be a function which return boolean

### instance method
- retrive or set data field with setter or getter 
- save: save your instance's data into database, every instance has a __data property(unenumerable) refer to its doc data
- update: use setter update your instance's data then use update to update into database
- delete: delete corresponding doc from database
- getData: return data object referred by __data property, if there's nested field, the corresponding filed is a instanct of nested DOC
- addData: you can add multi fields' data using this method

### decorated class method
- fireUp: if you don't want to new any instance and use class method for CRUD only, you need to call fireUp via class first to trigger schema setup phase before any CRUD operation
- checkData: after schema is set up(either by new a instance or by calling fireUp), you can check argument data against schema defination by calling checkData(data)
- getCollection: require a callback as parameter and pass the underlying collection instance to callback function
- getDB: require a callback as parameter and pass the underlying db instance to callback function
- extractPureData: require your DOC class' instance as parameter, if your argument has nested document, this will extract nested document's __data object and replac extracted data with corresponding field, be aware this method will modify your instance directly
- setDB: set db instance to use for your DOC class
- setCollectionName: default collction name for a DOC class is its lower-cased name, you can specify it by define a static method called setCollectionName and return wanted string when declaring your DOC class

### native driver functions

### aggregate operation
- aggregate
- mapReduce
- count
- distinct
- bulkWrite

### edge cases
- class method updateOne/updateMany don't support nested document
- for Object field, you have to assign new object to trigger __updateField
- decorated class method will not throw error for undefined data field

### CRUD operation
| operatrion | instance method | class method | native driver(via class method) |
| ------     | ------          | ------       |           ------                |
| Create     |  save           | insertOne    |        insertOneNative          |
| Create     |  save           | insertMany   |        insertManyNative         |
| Read       |  getter         | find         |        find                     |
| Read       |  getter         | findOne      |        findOneNative            |
| Update     |  setter + update | updateOne   |        updateOneNative          |
| Update     |  setter + update | replaceOne  |        replaceOneNative         |
| Update     |  setter + update | updateMany  |        updateManyNative         |
| Delete     |  delete         | deleteOne    |        deleteOneNative          |
| Delete     |  delete         | deleteMany   |        deleteManyNative         |
| Read and Update | getter + update | findOneAndUpdate | findOneAndUpdateNative |
| Read and Update | getter + update | findOneAndReplace| findOneAndReplaceNative|
| Read and Delete | getter + delete | findOneAndDelete | findOneAndDeleteNative |

| operation               | called-via  |           explaination         |  exmaple |
| ------                  | ------      |              ------            |  ------  |
| save                    | instance    | insert instance's doc data into db, return promise | ```book.save().then(r => console.log('saved'))```  |
| getter/setter           | instance    | get/set instance's data field      | ```book.price; book.price = 20``` |
| update                  | instance    | update instance's data into db, return promise | ```book.update().then(r => console.log('updated'))```    |
| delete                  | instance    | delete instance's data from db, return promise | ```book.delete().then(r => console.log('deleted'))```    |
| insertOne               | class       | insert doc into db, have the ability of checking doc data against schema defination, return primose | ```Book.insertOne({title: 'Last Evenings on Earth', publish: new Date(2007,3,30)}).then(r => console.log('inserted'))``` | 
| insertMany              | class       | insert many docs into db, have the ability of checking docs' data against schema defination, return promise | ```Book.insertMany([{title: 'title1'},{title: 'title2'}]).then(r => console.log('inserted'))```|
| insertOneNative         | class       | call native driver's insertOne, doesn't check data's validation, return promise | ```Book.insertOne({title: 'title insert by native driver'}).then(r => console.log('inserted'))``` |
| insertManyNative        | class       | call native driver's insertMany, doesn't check data's validation, return promise | ```Book.insertOne([{title: 'title1'},{title: 'title2'}]).then(r => console.log('inserted'))``` |
| find                    | class       | call native driver's find, return cursor in a promise | ```Book.find({title: '2666'}).then(cursor => cursor.toArray())``` |
| findOne                 | class       | call native driver's findOne, return matched doc in a promise | ```Book.findOne({title: '2666'}).then(doc => doc.title === '2666')``` |
| findOneNative           | class       | same as findOne | ```Book.findOneNative({title: '2666'}).then(doc => doc.title === '2666')```
| updateOne               | class       | update a matched doc, have the ability of checking updating data against schema defination, return promise | ```Book.updateOne({title: '2666'}, {$set: {copies: 8000}}).then(r => console.log('updated'))```
| updateOneNative         | class       | update a matched doc, doesn't check updating data's validation, return promise |```Book.updateOneNative({title: '2666'}, {$set: {copies: 20000}}).then(r => console.log('updated'))```
| replaceOne              | class       | replace a matched doc, have the ability of checking replacing data against schema defination, return promise | ```Book.replaceOne({title: '2666'},{title: 'new 2666'}).then(r => console.log('replaced'))```|
| replaceOneNative        | class       | replace a matched doc, doesn't check data's validation, return promise | ```Book.replaceOneNative({title: '2666'},{title: 'new 2666'}).then(r => console.log('replaced'))```|
| updateMany              | class       | update many matched docs, have the ability of checking updating data against schema defination, return promise |```Book.updateMany({title: /title/},{$set: {copies: 6000}}).then(r => console.log('updated'))```|
| updateManyNative        | class       | update many matched docs, doesn't check updating data's validation, return promise | ```Book.updateManyNative({title: /title/},{$set: {copies: 20000}}).then(r => console.log('updated'))``` |
| deleteOne               | class       | delete a matched doc, return promise | ```Book.deleteOne({title: '2666'}).then(r => console.log('deleted'))``` |
| deleteOneNative         | class       | same as deleteOne | ```Book.deleteOne({title: '2666'}).then(r => console.log('deleted'))``` |
| deleteMany              | class       | delete many matched docs, return promise | ```Book.deleteMany({title: /title/}).then(r => console.log('deleted'))``` |
| deleteManyNative        | class       | same as deleteMany | ```Book.deleteMany({title: /title/}).then(r => console.log('deleted'))``` |
| findOneAndUpdate        | class       | update a matched doc and return original or updated doc according to returnOriginal option in a promise, have the ability of checking updating data against schema defination | ```Book.findOneAndUpdate({title: '2666'},{$set: {copies: 6000}}).then(doc => doc.copies === 5000)``` |
| findOneAndUpdateNative  | class       | update a matched doc and return operation result in a promise, result.value is original or updated is according to returnOriginal option, doesn't check updating data's validation | ```Book.findOneAndUpdateNative({title: '2666'},{$set: {copies: 20000}}).then(result => result.value.copies === 5000)``` |
| findOneAndReplace       | class       | replace a matched doc and return original or replaced doc according to returnOriginal option in a promise, have the ability of checking replacing data against schema defination | ```Book.findOneAndReplace({title: '2666'},{title: '2666', copies: 6000}).then(doc => doc.copies === 5000)``` |
| findOneAndReplaceNative | class       | replace a matched doc and return operation result in a promise, result.value is original or replaced is according to returnOriginal option, doesn't check replacing data's validation | ```Book.findOneAndReplaceNative({title: '2666'},{title: '2666', copies: 20000}).then(result => result.value.copies === 5000)``` |
| findOneAndDelete        | class       | delete a matched doc and return original doc in a promise | ```Book.findOneAndDelete({title: '2666'}).then(doc => doc.title === '2666')``` |
| findOneAndDeleteNative  | class       | delete a matched doc and return operation result in a promise | ```Book.findOneAndDelete({title: '2666'}).then(result => result.value.title === '2666')``` |


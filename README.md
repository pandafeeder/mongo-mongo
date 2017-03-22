[![build status](https://img.shields.io/travis/pandafeeder/mongo-mongo/master.svg?style=flat-square)](https://travis-ci.org/pandafeeder/mongo-mongo)
[![npm version](https://img.shields.io/npm/v/mongo-mongo.svg?style=flat-square)](https://www.npmjs.com/package/mongo-mongo)
[![Coverage Status](https://coveralls.io/repos/github/pandafeeder/mongo-mongo/badge.svg?branch=master)](https://coveralls.io/github/pandafeeder/mongo-mongo?branch=master)

# __A ES6 class based mongoDB ODM__ *which is a wrapper upon offical mongodbjs driver*

### <a href="#中文-1">中文</a>

### features
- __Object based: an object representing a document in collection, with CRUD methods and all data fields are setter and getter accessor descriptors.__
- __schema: support multi constrain like type, unique, sparse, default, required and you can customize an validator function for a field.__
- __promise based: all operation return promise.__
- __decorated class mehod: class methods expose all CRUD operations with additional customization as data checking against schema defination and directly return doc for *findOneAndRepacle* *findOneAndUpdate* *findOneAndDelete* instead of a result (which you have to use result.value to get the doc in native way).__
- __native driver function exposed: you can also directly use offical driver's function via class methods whose name appended by Native or use constructed db instance from DB class.__

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
// no created field supplied in argument, a default new Date will be used, this will throw error if any field not satisfying schema defination
let book = new Book({title:'2666', publish: new Date(2008,10,10), copies: 5000, price: 12.2})
// insert data into database
book.save()
    .then(r => {console.log('saved!')})
    .catch(e => {console.log('something wrong when saving')})
```


### DB class
Constructed with a mongo connect string and option, it's a wrapper upon native driver's MongoClient. Once a instance is constructed, you can get native driver's db instance via ```db.getDB(db => console.log('db is a instance of native MongoDb'))```. The point is getDB returns a thunker which delays the evaluation of a paramless async function and cache the result(thanks to thunky module), that's to say for a specific db instande, it'll establish connection to db server only once, and the afterwards calling just reuse the same connection.
###### example:
```javascript
const DB = require('mongo-mongo').DB
const db = new DB('mongodb://localhost:27017/data')//,option as second parameter if any
db.getDB(db => {}) //do whatever you want with db instance inside arrow function
```

### constructor
You can use constructor in two ways:
1. only pass data argument and set db else where via class method setDB(recommeded)
2. pass both db and data arguments

both ways support constructing with no argument and add data field latter
###### example:
```javascript
// 1. only pass data to constructor
class YourDOC1 extends DOC {
    constructor(data) {
        super(data)
        this.setSchema({name: String})//define your schema here
    }
}
// 2. pass db and data to construcotr
class YourDOC2 extends DOC {
    constructor(db, data) {
        super(db, data)
        this.setSchema({name: String})//define your schema here
    }
}

// new instance with argument, setDB else where
let yourdoc1 = new YourDOC1({name: 'name'});
YourDOC1.setDB(db);
// laterly newed instance after yourdoc2 don't need db anymore since you've set it
let yourdoc2 = new YourDOC2(db, {name: 'name'})

// new instance without argument and setDB else where
let yourdoc1_1 = new YourDOC1(); YourDOC1.setDB(db);
let yourdoc2_1 = new YourDOC2(); YourDOC2.setDB(db);
// add data via setter, every data field is a setter/getter descriptor of your instance
yourdoc1_1.name = 'name'
yourdoc2_1.name = 'name'
```

### schema defination
set schema inside constructor via ```this.setSchema({})//schma object```
###### supported types:
- String
- Number
- Int: *refer to Int like so```const Int = require('mongo-mongo').types.Int```*
- Object
- Boolean
- Array
- Date
- nested document (multi nested levels supported)
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
      //for nested document type, use string
      author: 'Author',
      publish: Date,
      created: {type: Date, default: new Date()},
      price: Number,
      copies: {type: Int, validator: v => (v>100 && v<2000)},
      // embedded document as plain object
      recommedation: {type: Object, unique: true, sparse: true},
      // for Array, you can use Array, [], or [INNER_TYPE] as type constrain
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

// default value of created field will be added automatically since it's not supplied
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
- type: define a field's type, if you only want type constrain, use *```fieldName: TYPE```* for short
- unique: this will create a index by calling mongodb's native ```createIndex('yourFieldName', {unique: true})``` once for a DOC class
- default: when no value supplied, default will be used
- required: throw error when construct a new instance with data argument but no required field supplied or throw error when calling save if you construct instance without data argument
- sparse: this will create a index by calling mongodb's native ```createIndex('yourFieldName', {sparse: true})``` once for a DOC class
- validator: this must be a function which return boolean

### instance method
- for CRUD opeartion, please reder to <a href="#crud-operation">CRUD operation</a>
- retrive or set data field with setter or getter
- save: save your instance's data into database, every instance has a __data property(unenumerable) refer to its doc data
- update: use setter update your instance's data then use update to update into database
- delete: delete corresponding doc from database
- getData: return data object referred by __data property, if there's nested field, the corresponding filed is a instanct of nested document
- addData: you can add multi fields' data using this method

### class method
- for CRUD opeartion, please reder to <a href="#crud-operation">CRUD operation</a>
- getCollection: require a callback as parameter and pass the underlying collection instance to callback function
- getDB: require a callback as parameter and pass the underlying db instance to callback function
- setDB: set db instance to use for your DOC class
- setCollectionName: default collction name for a DOC class is its lower-cased name, you can specify it by define a static method called setCollectionName and return wanted string when declaring your DOC class

### native driver functions
- for CRUD opeartion, please reder to <a href="#crud-operation">CRUD operation</a>
- getCollection: require a callback as parameter and pass the underlying collection instance to callback function
- getDB: require a callback as parameter and pass the underlying db instance to callback function
- getDB via db instance: this is the save as above except you call it via db instance

### aggregate operation
all following class methods accept the same argument as corresponding native function, all result is returned in a promise
- aggregate
- mapReduce
- count
- distinct
- bulkWrite

### edge cases
- class method *updateOne/updateMany* don't support nested document right now, and don't support the following update operators: ```$inc, $mul, $rename, $min, $max, $addToSet, $setOnInsert```. The reason is that these operators need previous value, let's say a field has constrain as ```v <=100 && v >=90``` and its previous value is 100, $inc 1 will violate its constrain, in order to check against shcema defination, we have to retrive previous value first and do the caculation, this seems cubersome. Maybe we can add another function for above concern in later version.
- for Object field, you have to assign new object to trigger __updatedField, when calling a setter of a field, it push that field name into __updatedField array to keep track of which field is updated, but for a Object field, we set its property via instance.ObjectField.propery, this is actually calling a getter, thus no chance to update __updatedField, so if you update a nested Object property, please re-assign that field to trigger updating __updatedField, I made some extra effort for nested document, so nested document has no such limit, you should consider using a nested document over a nest Object in this condition.

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
| findOneAndDeleteNative  | class       | delete a matched doc and return operation result in a promise | ```Book.findOneAndDeleteNative({title: '2666'}).then(result => result.value.title === '2666')``` |

## 中文

### 特性

### 目录  
- <a href="#扫一眼">扫一眼</a>
- <a href="#DB-类">DB 类</a>
- <a href="#构造函数">构造函数</a>
- <a href="#schema-定义">schema 定义</a>
- <a href="#实例方法">实例方法</a>
- <a href="#类方法">类方法</a>
- <a href="#官方原生函数">官方原生函数</a>
- <a href="#边界情况">边界情况</a>
- <a href="#CRUD-操作">CRUD 操作</a>
- <a href="#计划">计划</a>


### 扫一眼
```javascript
const { DOC, DB, types } = require('mongo-mongo')

class Book extends DOC {
    constructor(data) {
        super(data)
        this.setSchema({
            title: {type: String, unique: true},
            // 如果只有类型限制，那么使用下面的简单形式
            publish: Date,
            created: {type: Date, default: new Date},
            copies: {
                type: types.Int,
                validator: v => (v >= 1000 && v <= 10000)
            }
            price: Number
        })
    }
    // 默认的collection的名字为类名的全小写，可以使用下面的方法来显示设置collection名字
    static setCollectionName() {
        return 'books'
    }
}

// 传给DB的参数与原生的MongoClient.connect参数一致
const db = new DB('mongodb://localhost:27017/db')
// 之后所有的CRUD操作都是复用同一个db实例
Book.setDB(db)
// 因为传入参数没有created值，created将使用default设定的new Date,如果传入的参数违反schema的定义，将抛出错误
let book = new Book({title:'2666', publish: new Date(2008,10,10), copies: 5000, price: 12.2})
// 向database插入数据
book.save()
    .then(r => {console.log('saved!')})
    .catch(e => {console.log('something wrong when saving')})
```


### DB class

DB class包了一层官方的MongoClient.connect, 创建实例的参数与传递给MongoClient.connect的参数一致。构造出实例后可以通过实例方法```db.getDB(db => {})```拿到官方的db实例。getDB实际上返回一个thunker，对于每一个实例，只与db server建立一次链接，以后每次取db的操作，实际上都是在复用之前的db实例。
###### 例子:
```javascript
const DB = require('mongo-mongo').DB
const db = new DB('mongodb://localhost:27017/data')//,option通过第二个参数传递
db.getDB(db => {db}) //在箭头函数内得到官方db
```

### 构造函数
你可以使用以下两种方法定义构造函数:
1. 仅传递data形参，然后在其他地方通过setDB类方法来指定要使用的db实例(推荐)
2. 传递db, data两个形参

两种方式都支持new实例时，不提供任何参数，稍后再添加数据
###### 例子:
```javascript
// 1. 仅传递data形参
class YourDOC1 extends DOC {
    constructor(data) {
        super(data)
        this.setSchema({name: String})//定义schema
    }
}
// 2. 传递db和data形参
class YourDOC2 extends DOC {
    constructor(db, data) {
        super(db, data)
        this.setSchema({name: String})//定义schema
    }
}

// 带data实参构造实例，用setDB指定要使用的db实例
let yourdoc1 = new YourDOC1({name: 'name'});
YourDOC1.setDB(db);
// 带db和data实参构造实例，之后构造的实例不必再提供db实参，因为第一次已经提供了
let yourdoc2 = new YourDOC2(db, {name: 'name'})

// 不带任何实参构造实例,用setDB指定要使用的db实例
let yourdoc1_1 = new YourDOC1(); YourDOC1.setDB(db);
let yourdoc2_1 = new YourDOC2(); YourDOC2.setDB(db);
// 通过setter添加数据, 每一个schema中定义的数据都是一个setter/getter描述符
yourdoc1_1.name = 'name'
yourdoc2_1.name = 'name'
```

### schema 定义
在构造函数内通过来定义```this.setSchema({})//参数为schema对象```schema
###### 支持的类型:
- String
- Number
- Int: *通过```const Int = require('mongo-mongo').types.Int```来使用Int*
- Object
- Boolean
- Array
- Date
- nested document (支持任意层级的嵌套)
###### nested document 例子
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
      //使用字符串来定义 nested document 类型
      author: 'Author',
      publish: Date,
      created: {type: Date, default: new Date()},
      price: Number,
      copies: {type: Int, validator: v => (v>100 && v<2000)},
      // 嵌套纯Object
      recommedation: {type: Object, unique: true, sparse: true},
      // 可以使用Array,或[],或[类型]来定义
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

// 实参没提供created, created将使用默认值
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


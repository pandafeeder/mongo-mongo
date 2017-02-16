'use strict'
const ObjectID = require('mongodb').ObjectID
const DB = require('./db')
const co = require('co')
const types = require('./types')
/**
 *
 *
 */
class DOC {
  constructor() {
    if (new.target === DOC) {
      throw new Error('DOC class cannot be instanciated directly, please subclass it first')
    }
    this._parseArguments(Array.from(arguments))
    this.__checked = false
    this.__saved = false
    this.__updatedField = []
    Object.getPrototypeOf(this).__allSetup ? null : this._packProtoProperties()
    this._packProperties()
  }

  /**parse constructor's arugments
   */
  _parseArguments(arg) {
    let proto = Object.getPrototypeOf(this)
    if (arg.length === 0) {
      throw new Error(`call super(db, data) or super(db) in your constructor`)
    }
    else if (arg.length === 1) {
      if (arg[0] !== undefined) {
        if (Object.prototype.toString.call(arg[0]) === '[object Object]') {
          this.__data = arg[0]
          if (!this.__data._id) {
            this.__id = this.__data._id = ObjectID.createPk()
          } else {
            this.__id = this.__data._id
          }
        } else {
            throw new Error(`argument to ${this.constructor.name} must be plain data object`)
        }
      } else {
        this.__data = {}
        this.__id = this.__data._id = ObjectID.createPk()
      }
    }
    else if (arg.length === 2) {
      if (!(arg[0] instanceof DB)) {
        throw new Error(`your first argument to super is not an DB instance`)
      } else {
        proto.__db = proto.__db || arg[0]
      }
      if (arg[1] !== undefined) {
        if (Object.prototype.toString.call(arg[1]) !== '[object Object]') {
          throw new Error(`data argument to ${this.constructor.name} must be a plain object`)
        }
        this.__data = arg[1]
        if (!this.__data._id) {
          this.__id = this.__data._id = ObjectID.createPk()
        } else {
          this.__id = this.__data._id
        }
      }
      if (arg[1] === undefined) {
        this.__data = {}
        this.__id = this.__data._id = ObjectID.createPk()
      }
    }
    else {
      throw new Error(`call super(db, data) or super(data) first in your constructor`)
    }
  }

  /**make these properties unaccessable in enumeration,
   */
  _packProperties() {
    Object.defineProperties(this, {
      __db:                   {enumerable: false, writable: false, configurable: false},
      __unique:               {enumerable: false, writable: false, configurable: false},
      __sparse:               {enumerable: false, writable: false, configurable: false},
      __collection:           {enumerable: false, writable: false, configurable: false},
      __schema:               {enumerable: false, writable: false, configurable: false},
      __default:              {enumerable: false, writable: false, configurable: false},
      __requiredButNoDefault: {enumerable: false, writable: false, configurable: false},
      __defined:              {enumerable: false, writable: false, configurable: false},
      //__setup true indicates prototype's schema has been setup
      //thus no repeative call for afterwards objects
      __setup:                {enumerable: false, writable: false, configurable: false},
      //__inited true indicates createIndex is done
      //thus no repeative call for afterwards objects
      __inited:               {enumerable: false, writable: false, configurable: false},
      __checked:              {enumerable: false, writable: true},
      __data:                 {enumerable: false, writable: true},
      __saved:                {enumerable: false, writable: true},
      __id:                   {enumerable: false, writable: true},
      __updatedField:         {enumerable: false, writable: true},
    })
  }

  _packProtoProperties() {
    let proto = Object.getPrototypeOf(this)
    proto.__collection = proto.__collection ||
        this.constructor.setCollectionName
          ? this.constructor.setCollectionName()
          : this.constructor.name.toLowerCase()

    proto.__schema = proto.__schema || {}
    proto.__requiredButNoDefault = proto.__requiredButNoDefault || []
    proto.__default = proto.__default || []
    proto.__unique = proto.__unique || []
    proto.__sparse = proto.__sparse || []
    proto.__defined = proto.__defined || false
    proto.__inited = proto.__inited || false
    proto.__allSetup = true
  }

  /**
   * initial check against data params passed in constructor
   */
  initCheck() {
    //skip if obj is constructed with no arguments, then will check inside save
    if (Object.keys(this.__data).length > 1) {
      let proto = Object.getPrototypeOf(this)
      proto.__requiredButNoDefault.forEach(v => {
        if (!this.__data.hasOwnProperty(v)) {
          throw new Error(`${v} is required, but not supplied`)
        }
      })
      proto.__default.forEach(v => {
        if (!this.__data.hasOwnProperty(v)) {
          this.__data[v] = proto.__schema[v]['default']
        }
      })
      Object.keys(this.__data).forEach(e => {
        if (e === '_id') return
        //thorw error for any un-predefined schema
        if (!proto.__schema[e]) throw new Error(`no ${e} field in schema`)
        this.singleCheck(proto.__schema[e], this.__data[e])
      })
      this.__checked = true
    }
  }

  /**
   * setup prototype's schema, default, requiredButNoDefault and unique properties
   */
  setSchema(schemaObj) {
    let proto = Object.getPrototypeOf(this)
    if (!proto.__setup) {
      if (Object.prototype.toString.call(schemaObj) !== '[object Object]') {
        throw new Error(`argument to setSchema function must be an palin object`)
      }
      Object.keys(schemaObj).forEach(e => {
        if (Object.prototype.toString.call(schemaObj[e]) === '[object Object]') {
          Object.keys(schemaObj[e]).forEach(v => {
            if (['type','unique','sparse','default','validator', 'required'].indexOf(v) < 0) {
              throw new Error(`${v} is not supported in schema defination, 
              schema only support type, unique, sparese, default, validator, required currently`)
            }
          })
          if (!schemaObj[e].hasOwnProperty('type')) {
            throw new Error(`no type constrain defined for ${schemaField}`)
          }
          if (schemaObj[e].hasOwnProperty('validator')) {
            if (typeof schemaObj[e]['validator'] !== 'function') {
              throw new Error(`${schemaObj[e]['validator']} must be a function}`)
            }
          }
          if (schemaObj[e].required && !schemaObj[e].hasOwnProperty('default')) {
            proto.__requiredButNoDefault.push(e)
          }
          if (schemaObj[e].hasOwnProperty('default')) {
            proto.__default.push(e)
          }
          ['unique', 'sparse'].forEach(k => {
            if (schemaObj[e].hasOwnProperty(k)){
              if (typeof schemaObj[e][k] === 'boolean') {
                if (schemaObj[e][k]) proto['__'+k].push(e)
              } else {
                throw new Error(`unique/sparse must be boolean type`)
              }
            }
          })
        }
        proto.__schema[e] = schemaObj[e]
      })
      proto.__setup = true
    }
    if (!this.__checked) {
      this.initCheck()
    }
    if (!proto.__defined) {
      this.defineDOCDataProperties()
    }
    Object.preventExtensions(this)
  }

  /**
   * check schema against input data param, throw Error when not matching
   * @param {dataType} schemaField, schema type, Array, String... or {type: Array/...}
   * @param {data} dataField, the input data corresponding to its schema name
   */
  singleCheck(schemaField, dataField) {
    switch (Object.prototype.toString.call(schemaField)) {
      case '[object Function]':
        if (Object.prototype.toString.call(dataField).slice(8,-1) !==  schemaField.name) {
          if (schemaField === types.Int) {
            types.Int(dataField)
          }
          else if (schemaField === types.Float) {
            types.Float(dataField)
          }
          else {
            throw new Error(`${dataField} is not ${schemaField.name}`)
          }
        }
        break
      case '[object Object]':
        this.singleCheck(schemaField['type'], dataField)
        if (schemaField['validator']) {
          if (!schemaField['validator'](dataField)) {
            throw new Error(`${dataField} didnot pass validator function`)
          }
        }
        break
      case '[object Array]':
        if (schemaField.length === 0) {
          if(Object.prototype.toString.call(dataField).slice(8,-1) !== 'Array') {
            throw new Error(`${dataField} is not Array`)
          }
        } 
        else if (schemaField.length === 1) {
          if(Object.prototype.toString.call(dataField).slice(8,-1) !== 'Array') {
            throw new Error(`${dataField} is not Array`)
          }
          dataField.forEach(v => {
            this.singleCheck(schemaField[0], v)
          })
        }
        else {
          throw new Error(`only [] or [ONE_TYPE_CONSTRAIN] is supported currently`)
        }
        break
      default:
        throw new Error(`unrecognized schema type for ${schemaField}`)
    }
  }

  /**
   * convert each schema into prototype's propery
   * with descriptor {set:xxx, get:xxx, enumerable:true, configurable:true}
   */
  defineDOCDataProperties() {
    let proto = Object.getPrototypeOf(this)
    Object.keys(proto.__schema).forEach( v => {
      Object.defineProperty(proto, v, {
        get: function() {return this.__data[v]},
        set: function(value) {
          //make sure updated data comply with schema defination
          //call user's custome validator function inside singleCheck
          this.singleCheck(proto.__schema[v], value)
          this.__data[v] = value
          this.__updatedField.push(v)
        },
        enumerable: true,
        configurable: true
      })
    })
    proto.__defined = true
  }

  /**set prototype's collection property
   */
  getCollectionName() {
    //same doc class should share same collection name too
    let proto = Object.getPrototypeOf(this)
    proto.__collection = 
        this.constructor.setCollectionName
          ? this.constructor.setCollectionName()
          : this.constructor.name.toLowerCase()
    return proto.__collection
  }

  /**exposed API for directly dealing with collection instance from native mongodb
   * @param {function} callback function with collection instance as param
   */
  static getCollection(callback) {
    let proto = this.prototype
    proto.__collection ? null :
      this.setCollectionName ?
        this.setCollectionName()
        : this.name.toLowerCase()
    if (!proto.__db) 
      throw new Error(`you haven't set db yet. use ${this.name}.setDB(db) to set one`)
    proto.__db.getDB( db => {
      callback(db.collection(proto.__collection))
    })
  }
  static getDB(callback) {
    let proto = this.prototype
    if (!proto.__db) 
      throw new Error(`you haven't set db yet. use ${this.name}.setDB(db) to set one`)
    proto.__db.getDB(db => {
      callback(db)
    })
  }

  /**invoke native mongodb's insertOne
   * return Promise which resolve result param of insertOne's callback 
   * reject error param of insertOne's callback
   */
  save() {
    //first time execution of save
    if (!this.__saved) {
      this.__saved = true
      let self = this
      let proto = Object.getPrototypeOf(this)
      proto.__collection ? null : this.getCollectionName()
      let inited = proto.__inited
      if (!proto.__inited) {
        proto.__inited = true
      }
      let operations = co(function* () {
        if (Object.keys(self.__data).length === 0) {
          throw new Error('you have not defined any data yet before saving')
        }
        //this if block createIndex according to schema's unique and sparse setup
        if (!inited) {
          //cancel exposing setup collection's validator AIP, seems not practical
          //if (self.constructor.setValidator && !validated) {
          //  let hasError = false
          //  let validOptObj = self.constructor.setValidator()
          //  yield new Promise(function(resolve, reject) {
          //    proto.__db.getDB(function(db) {
          //      db.createCollection(proto.__collection, validOptObj, function(err, result) {
          //        if (err) reject({_error: err})
          //        resolve({_result: result})
          //      })
          //    })
          //  }).catch(e => hasError = true)
          //  if (hasError) {
          //    let args = {collMod: proto.__collection}
          //    args.validator = validOptObj.validator
          //    if (validOptObj.validationLevel) args.validationLevel = validOptObj.validationLevel
          //    if (validOptObj.validationAction) args.validationAction = validOptObj.validationAction
          //    yield new Promise(function(resolve, reject) {
          //      proto.__db.getDB(function(db) {
          //        db.command(args, function(err, result) {
          //          if (err) reject(err)
          //          resolve(result)
          //        })
          //      })
          //    })
          //  }
          //}
          if (proto.__unique.length > 0 && proto.__sparse.length > 0) {
            let sparseTemp = proto.__sparse.slice()
            for (let i = 0; i < proto.__unique.length; i++) {
              let exist = sparseTemp.indexOf(proto.__unique[i])
              if (exist > -1) {
                sparseTemp.splice(exist, 1)
                yield self.createIndex({[proto.__unique[i]]: 1}, {unique: true, sparese: true})
              } else {
                yield self.createIndex({[proto.__unique[i]]: 1}, {unique: true})
              }
            }
            if (sparseTemp.length > 0) {
              for (let i = 0; i < sparseTemp.length; i++) {
                  yield self.createIndex({[sparseTemp[i]]: 1}, {sparse: true})
              }
            }
          }
          if (proto.__unique.length > 0 && proto.__sparse.length === 0) {
            for (let i = 0; i < proto.__unique.length; i++) {
                yield self.createIndex({[proto.__unique[i]]: 1}, {unique: true})
            }
          }
          if (proto.__unique.length === 0 && proto.__sparse.length > 0) {
            for (let i = 0; i < proto.__sparse.length; i++) {
                yield self.createIndex({[proto.__sparse[i]]: 1}, {sparse: true})
            }
          }
        }
        let data = Object.assign({}, self.__data)
        return yield new Promise(function(resolve, reject) {
          self.constructor.getCollection(function(coll) {
            coll.insertOne(data, function(err, result) {
              if (err) reject(err)
              resolve(result)
            })
          })
        })
      })
      return operations
    } else {
      //once object has been saved, another save call invokes update instead
      this.update()
    }
  }

  /**native's update method has been deprected, this method used to save updates on a instance
   */
  update() {
    if (!this.__saved) {
      throw new Error('please save first')
    }
    let updateKV = {}
    this.__updatedField.forEach(v => {
      updateKV[v] = this[v]
    })
    this.__updatedField = []
    return new Promise((resolve, reject) => {
      this.constructor.getCollection(coll => {
        coll.updateOne({_id: this.__id}, {$set: updateKV}, (err, result) => {
          if (err) reject(err)
          resolve(result)
        })
      })
    })
  }

  //toString() {
  //}
  //toJSON() {
  //}
  addData(dataObj) {
    Object.keys(dataObj).forEach(k => {
      this[k] = dataObj[k]
    })
  }
  /**invoke native mongodb's createIndex
   * return Promise which resolve result param of insertOne's callback 
   * reject error param of insertOne's callback
   */
  createIndex(indexDefination, option) {
    return new Promise((resolve, reject) => {
      this.constructor.getCollection(coll => {
        coll.createIndex(indexDefination, option, (err, result) => {
          if (err) reject(err)
          resolve(result)
        })
      })
    })
  }


  /**added method, invoke native's findOne method, returns a new object construced with returned doc by native
   */
  static findOneAndNew(query, options) {
    this._checkDBExistence()
    return new Promise((resolve, reject) => {
      this.prototype.__db.getDB(db => {
        db.collection(this.prototype.__collection)
          .findOne(query, options)
          .then(doc => {
            let obj = new this(doc)
            obj.__saved = true
            resolve(obj)
          })
          .catch(e => reject(e))
      })
    })
  }

  static setDB(db) {
    this.prototype.__db ? null : this.prototype.__db = db
    if (!this.prototype.__collection) {
      this.setCollectionName
        ? this.setCollectionName()
        : this.name.toLowerCase()
    }
  }

  static _checkDBExistence() {
    let proto= this.prototype
    if (!proto.__db) throw new Error(`No db defined yet, use ${this.name}.setDB(db) to define which db to be used`)
  }
  //the following are commonly used  native's CURD functions
  //1. CREATE
  static insert() {
    console.warn('insert is Deprecated: use findOneAndDelete instead')
  }
  static insertOne(doc, options) {
    this._checkDBExistence()
    return new Promise((resolve, reject) => {
      this.prototype.__db.getDB(db => {
        db.collection(this.prototype.__collection).insertOne(doc, options)
          .then(result => resolve(result))
          .catch(e => reject(e))
      })
    })
  }
  static insertMany(docs, options) {
    this._checkDBExistence()
    return new Promise((resolve, reject) => {
      this.prototype.__db.getDB(db => {
        db.collection(this.prototype.__collection).insertMany(docs, options)
          .then(result => resolve(result))
          .catch(e => reject(e))
      })
    })
  }

  //2. UPDATE
  static findAndModify() {
    console.warn('findAndModify is deprecated: use findOneAndUpdate, findOneAndReplace or findOneAndDelete instead')
  }
  static replaceOne(filter, doc, options, callback) {
    this._checkDBExistence()
    return new Promise((resolve, reject) => {
      this.prototype.__db.getDB(db => {
        db.collection(this.prototype.__collection)
          .replaceOne(filter, doc, options, callback)
          .then(result => resolve(result))
          .catch(e => reject(e))
      })
    })
  }
  static updateOne(filter, update, options, callback) {
    this._checkDBExistence()
    return new Promise((resolve, reject) => {
      this.prototype.__db.getDB(db => {
        db.collection(this.prototype.__collection)
          .updateOne(filter, update, options, callback)
          .then(result => resolve(result))
          .catch(e => reject(e))
      })
    })
  }
  static updateMany(filter, update, options, callback) {
    this._checkDBExistence()
    return new Promise((resolve, reject) => {
      this.prototype.__db.getDB(db => {
        db.collection(this.prototype.__collection)
          .updateMany(filter, update, options, callback)
          .then(result => resolve(result))
          .catch(e => reject(e))
      })
    })
  }
  static findOneAndReplace(filter, replacement, options) {
    this._checkDBExistence()
    return new Promise((resolve, reject) => {
      this.prototype.__db.getDB(db => {
        db.collection(this.prototype.__collection)
          .findOneAndReplace(filter, replacement, options)
          .then(result => {
            resolve(result)
          })
          .catch(e => reject(e))
      })
    })
  }
  static findOneAndUpdate(filter, update, options, callback) {
    this._checkDBExistence()
    return new Promise((resolve, reject) => {
      this.prototype.__db.getDB(db => {
        db.collection(this.prototype.__collection)
          .findOneAndUpdate(filter, update, options, callback)
          .then(result => {
            resolve(result)
          })
          .catch(e => reject(e))
      })
    })
  }

  //3. READ
  static find(query) {
    this._checkDBExistence()
    return new Promise((resolve, reject) => {
      this.prototype.__db.getDB(db => {
        try {
          resolve(db.collection(this.prototype.__collection).find(query))
        } catch (e) {
          reject(e)
        }
      })
    })
  }
  static findOne(query, option) {
    this._checkDBExistence()
    return new Promise((resolve, reject) => {
      this.prototype.__db.getDB(db => {
        db.collection(this.prototype.__collection)
          .findOne(query, option)
          .then(doc => {
            resolve(doc)
          })
          .catch(e => reject(e))
      })
    })
  }

  //4. DELETE
  static findAndRemove() {
    console.warn('findAndRemove is Deprecated: use findOneAndDelete instead')
  }
  static remove() {
    console.warn('remove is Deprecated: use deleteOne, deleteMany or bulkWrite')
  }
  static findOneAndDelete(filter, options) {
    this._checkDBExistence()
    return new Promise((resolve, reject) => {
      this.prototype.__db.getDB(db => {
        db.collection(this.prototype.__collection)
          .findOneAndDelete(filter, option)
          .then(result => {
            resolve(result)
          })
          .catch(e => reject(e))
      })
    })
  }

}

module.exports = exports = DOC

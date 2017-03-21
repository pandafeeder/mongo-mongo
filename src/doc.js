
const ObjectID = require('mongodb').ObjectID;
const DB = require('./db');
const co = require('co');
const types = require('./types');

const unsupportedUpdateOperator = [
  '$inc', '$mul', '$rename', '$min', '$max', '$addToSet', '$setOnInsert',
];
const supportedUpdateOperator = [
  '$set', '$unset', '$currentDate', '$pop', '$pullAll', '$pull', '$push',
];
const deprecatedUpdateOperator = ['$pushAll'];
/**
 *
 *
 */
class DOC {
  constructor() {
    if (new.target === DOC) {
      throw new Error('DOC class cannot be instanciated directly, please subclass it first');
    }
    this._parseArguments(Array.from(arguments));
    this.__checked = false;
    this.__saved = false;
    this.__updatedField = [];
    if (!Object.getPrototypeOf(this).__allSetup) this._packProtoProperties();
    this._packProperties();
  }

  /** parse constructor's arugments
   */
  _parseArguments(arg) {
    const proto = Object.getPrototypeOf(this);
    if (arg.length === 0) {
      throw new Error('call super(db, data) or super(db) in your constructor');
    } else if (arg.length === 1) {
      if (arg[0] !== undefined) {
        if (Object.prototype.toString.call(arg[0]) === '[object Object]') {
          this.__data = arg[0];
          if (!this.__data._id) {
            this.__data._id = ObjectID.createPk();
            this.__id = this.__data._id;
          } else {
            this.__id = this.__data._id;
          }
        } else {
          throw new Error(`argument to ${this.constructor.name} must be plain data object`);
        }
      } else {
        this.__data = {};
        this.__data._id = ObjectID.createPk();
        this.__id = this.__data._id;
      }
    } else if (arg.length === 2) {
      if (arg[0] && !(arg[0] instanceof DB)) {
        throw new Error('your first argument to super is not an DB instance');
      } else {
        proto.__db = proto.__db || arg[0];
      }
      if (arg[1] !== undefined) {
        if (Object.prototype.toString.call(arg[1]) !== '[object Object]') {
          throw new Error(`data argument to ${this.constructor.name} must be a plain object`);
        }
        this.__data = arg[1];
        if (!this.__data._id) {
          this.__data._id = ObjectID.createPk();
          this.__id = this.__data._id;
        } else {
          this.__id = this.__data._id;
        }
      }
      if (arg[1] === undefined) {
        this.__data = {};
        this.__data._id = ObjectID.createPk();
        this.__id = this.__data._id;
      }
    } else {
      throw new Error('call super(db, data) or super(data) first in your constructor');
    }
  }

  /** make these properties unaccessable in enumeration,
   */
  _packProperties() {
    Object.defineProperties(this, {
      __db: { enumerable: false, writable: false, configurable: false },
      __unique: { enumerable: false, writable: false, configurable: false },
      __sparse: { enumerable: false, writable: false, configurable: false },
      __collection: { enumerable: false, writable: false, configurable: false },
      __schema: { enumerable: false, writable: false, configurable: false },
      __default: { enumerable: false, writable: false, configurable: false },
      __required: { enumerable: false, writable: false, configurable: false },
      __requiredButNoDefault: { enumerable: false, writable: false, configurable: false },
      __defined: { enumerable: false, writable: false, configurable: false },
      // __setup true indicates prototype's schema has been setup
      // thus no repeative call for afterwards objects
      __setup: { enumerable: false, writable: false, configurable: false },
      // __inited true indicates createIndex is done
      // thus no repeative call for afterwards objects
      __inited: { enumerable: false, writable: false, configurable: false },
      __embedded: { enumerable: false, writable: false, configurable: false },
      __checked: { enumerable: false, writable: true },
      __data: { enumerable: false, writable: true },
      __saved: { enumerable: false, writable: true },
      __id: { enumerable: false, writable: true },
      __updatedField: { enumerable: false, writable: true },
    });
  }

  _packProtoProperties() {
    const proto = Object.getPrototypeOf(this);

    // proto.__collection = proto.__collection ||
    //     this.constructor.setCollectionName
    //       ? this.constructor.setCollectionName()
    //       : this.constructor.name.toLowerCase();

    if (!proto.__collection) {
      if (this.constructor.setCollectionName) {
        proto.__collection = this.constructor.setCollectionName();
      } else {
        proto.__collection = this.constructor.name.toLowerCase();
      }
    }

    proto.__schema = proto.__schema || {};
    proto.__requiredButNoDefault = proto.__requiredButNoDefault || [];
    proto.__default = proto.__default || [];
    proto.__required = proto.__required || [];
    proto.__embedded = proto.__embedded || [];
    proto.__unique = proto.__unique || [];
    proto.__sparse = proto.__sparse || [];
    proto.__defined = proto.__defined || false;
    proto.__inited = proto.__inited || false;
    proto.__allSetup = true;
  }

  /**
   * initial check against data params passed in constructor
   */
  initCheck() {
    const proto = Object.getPrototypeOf(this);
    if (Object.keys(this.__data).length > 1) {
      proto.__requiredButNoDefault.forEach((v) => {
        if (!Object.prototype.hasOwnProperty.call(this.__data, v)) {
          throw new Error(`${v} is required, but not supplied nor default defined`);
        }
      });
      Object.keys(this.__data).forEach((e) => {
        if (e === '_id') return;
        // thorw error for any un-predefined schema
        if (!proto.__schema[e]) throw new Error(`no ${e} field in schema`);
        this.singleCheck(proto.__schema[e], this.__data[e]);
        // for embedded field, copy embedded obj's __data and delete _id
        // if (this.__data[e].hasOwnProperty('__data')) {
        //  let valueDataWithoutId = Object.assign({}, this.__data[e].__data)
        //  delete valueDataWithoutId._id
        //  this.__data[e] = valueDataWithoutId
        // }
      });
      this.__checked = true;
    }
    // after setup each field's schema, set each deault value if corresponding data not supplied
    proto.__default.forEach((v) => {
      if (!Object.prototype.hasOwnProperty.call(this.__data, v)) {
        this.singleCheck(proto.__schema[v], proto.__schema[v].default);
        this.__data[v] = proto.__schema[v].default;
      }
    });
  }

  /**
   * check data's sanity against prototype's schema
   */
  static checkData(data) {
    const proto = this.prototype;
    Object.keys(data).forEach((e) => {
      if (e === '_id') return;
      if (!proto.__schema[e]) throw new Error(`no ${e} field in schema`);
      proto.singleCheck(proto.__schema[e], data[e]);
    });
  }

  /**
   *
   */
  static fireUp() {
    new this();
  }

  /**
   *check updated data's sanity against prototype's schema
   */
  static checkUpdateData(update, type) {
    unsupportedUpdateOperator.forEach((v) => {
      if (Object.prototype.hasOwnProperty.call(update, v)) {
        throw new Error(`${v} is not a supported operator in mongo-mongo right now
        for this needs previous value for checking whether it can or cannot pass schema defination
        you can use updateOneNative with the risk of updated value breaking schema defination`);
      }
    });
    if (Object.keys(update).some(ele => deprecatedUpdateOperator.indexOf(ele) > -1)) {
      throw new Error('deprecated update operator $pushAll, use the $push operator with $each instead.');
    }
    if (Object.keys(update).some(ele => supportedUpdateOperator.indexOf(ele) > -1)) {
      const updateObj = {};
      const reg = /\./;
      Object.keys(update).forEach((e) => {
        if (e === '$set') {
          if (Object.keys(update[e]).some(k => reg.test(k))) {
            throw new Error('mongo-mongo\'s updateOne doesn\'t support nested obj, consider updateOneNative please');
          }
          Object.keys(update[e]).forEach((k) => {
            if ((type === 'many') && this.prototype.__unique.indexOf(k) > -1) {
              throw new Error(`${k} is set to be unique in schema, you can't $set it in updateMany`);
            }
            updateObj[k] = update[e][k];
          });
        }
        if (e === '$unset') {
          if (Object.keys(update[e]).some(k => reg.test(k))) {
            throw new Error('mongo-mongo\'s updateOne doesn\'t support nested obj, consider updateOneNative please');
          }
          // check if $unset object's key is in __required array, if so throw error
          if (Object.keys(update[e]).some(k => this.prototype.__required.indexOf(k) > -1)) {
            throw new Error('some or one keys in $unset operator is set to be requred, you can\'t remove them/it');
          }
        }
        // mongodb js doesn't support $setOnInsert operator on updateOne and updateMany
        // if (e === '$setOnInsert') {
        //   if (Object.keys(update[e]).some(k => reg.test(k))) {
        //     throw new Error('mongo-mongo\'s updateOne doesn\'t support nested obj, consider updateOneNative please');
        //   }
        //   Object.keys(update[e]).forEach((k) => {
        //     if ((type === 'many') && this.prototype.__unique.indexOf(k) > -1) {
        //       throw new Error(`${k} is set to be unique in schema, you can't $setOnInsert it in updateMany`);
        //     }
        //     updateObj[k] = update[e][k];
        //   });
        // }
        if (e === '$currentDate') {
          if (Object.keys(update[e]).some(k => reg.test(k))) {
            throw new Error('mongo-mongo\'s updateOne doesn\'t support nested obj, consider updateOneNative please');
          }
          Object.keys(update[e]).forEach((k) => {
            if ((type === 'many') && this.prototype.__unique.indexOf(k) > -1) {
              throw new Error(`${k} is set to be unique in schema, you can't $currentDate it in updateMany`);
            }
            updateObj[k] = new Date();
          });
        }
        if (e === '$push') {
          if (Object.keys(update[e]).some(k => reg.test(k))) {
            throw new Error('mongo-mongo\'s updateOne doesn\'t support nested obj, consider updateOneNative please');
          }
          Object.keys(update[e]).forEach((k) => {
            if (Object.prototype.hasOwnProperty.call(update[e][k], '$each')) {
              updateObj[k] = update[e][k].$each;
            } else {
              updateObj[k] = [update[e][k]];
            }
          });
        }
      });
      this.checkData(updateObj);
    } else {
      this.checkData(update);
    }
  }

  /**
   * setup prototype's schema, default, requiredButNoDefault and unique properties
   */
  setSchema(schemaObj) {
    const proto = Object.getPrototypeOf(this);
    if (!proto.__setup) {
      if (Object.prototype.toString.call(schemaObj) !== '[object Object]') {
        throw new Error('argument to setSchema function must be an palin object');
      }
      Object.keys(schemaObj).forEach((e) => {
        if (e === '__data') throw new Error('please don\'t use __data as field name for it\'s preserved by mongo-mongo');
        // for elaborated defination, like name: {type: String}
        if (Object.prototype.toString.call(schemaObj[e]) === '[object Object]') {
          Object.keys(schemaObj[e]).forEach((v) => {
            if (['type', 'unique', 'sparse', 'default', 'validator', 'required'].indexOf(v) < 0) {
              throw new Error(`${v} is not supported in schema defination, 
              schema only support type, unique, sparese, default, validator, required currently`);
            }
          });
          if (!Object.prototype.hasOwnProperty.call(schemaObj[e], 'type')) {
            throw new Error(`no type constrain defined for ${schemaObj[e]}`);
          }
          if (Object.prototype.hasOwnProperty.call(schemaObj[e], 'validator')) {
            if (typeof schemaObj[e].validator !== 'function') {
              throw new Error(`${schemaObj[e].validator} must be a function`);
            }
          }
          if (schemaObj[e].required) {
            proto.__required.push(e);
            if (!Object.prototype.hasOwnProperty.call(schemaObj[e], 'default')) {
              proto.__requiredButNoDefault.push(e);
            }
          }
          if (Object.prototype.hasOwnProperty.call(schemaObj[e], 'default')) {
            proto.__default.push(e);
          }
          ['unique', 'sparse'].forEach((k) => {
            if (Object.prototype.hasOwnProperty.call(schemaObj[e], k)) {
              if (typeof schemaObj[e][k] === 'boolean') {
                if (schemaObj[e][k]) proto[`__${k}`].push(e);
              } else {
                throw new Error('unique/sparse must be boolean type');
              }
            }
          });
        }
        // for embedded doc
        if (Object.prototype.toString.call(schemaObj[e]) === '[object String]') {
          proto.__embedded.push(e);
        }
        proto.__schema[e] = schemaObj[e];
      });
      proto.__setup = true;
    }
    if (!this.__checked) {
      this.initCheck();
    }
    if (!proto.__defined) {
      this.defineDOCDataProperties();
    }
    Object.preventExtensions(this);
  }

  /**
   * check schema against input data param, throw Error when not matching
   * @param {dataType} schemaField, schema type, Array, String... or {type: Array/...}
   * @param {data} dataField, the input data corresponding to its schema name
   */
  singleCheck(schemaField, dataField) {
    switch (Object.prototype.toString.call(schemaField)) {
      case '[object Function]':
        if (Object.prototype.toString.call(dataField).slice(8, -1) !== schemaField.name) {
          if (schemaField === types.Int) {
            types.Int(dataField);
          } else {
            throw new Error(`${dataField} is not ${schemaField.name}`);
          }
        }
        break;
      case '[object Object]':
        this.singleCheck(schemaField.type, dataField);
        if (schemaField.validator) {
          if (!schemaField.validator(dataField)) {
            throw new Error(`${dataField} did not pass validator function`);
          }
        }
        break;
      case '[object Array]':
        if (schemaField.length === 0) {
          if (Object.prototype.toString.call(dataField).slice(8, -1) !== 'Array') {
            throw new Error(`${dataField} is not Array`);
          }
        } else if (schemaField.length === 1) {
          if (Object.prototype.toString.call(dataField).slice(8, -1) !== 'Array') {
            throw new Error(`${dataField} is not Array`);
          }
          dataField.forEach((v) => {
            this.singleCheck(schemaField[0], v);
          });
        } else {
          throw new Error('only [] or [ONE_TYPE_CONSTRAIN] is supported currently');
        }
        break;
      case '[object String]':
        if (dataField.constructor.name !== schemaField) {
          throw new Error(`data for ${schemaField} is not a instance of ${schemaField}`);
        }
        break;
      default:
        throw new Error(`unrecognized schema type for ${schemaField}`);
    }
  }

  /**
   * convert each schema into prototype's propery
   * with descriptor {set:xxx, get:xxx, enumerable:true, configurable:true}
   */
  defineDOCDataProperties() {
    const proto = Object.getPrototypeOf(this);
    Object.keys(proto.__schema).forEach((v) => {
      Object.defineProperty(proto, v, {
        get() { return this.__data[v]; },
        set(value) {
          // make sure updated data comply with schema defination
          // call user's custome validator function inside singleCheck
          this.singleCheck(proto.__schema[v], value);
          // if (value.hasOwnProperty('__data')) {
          //  let valueDataWithoutId = Object.assign({}, value.__data)
          //  delete valueDataWithoutId._id
          //  this.__data[v] = valueDataWithoutId
          // } else {
          // }
          this.__data[v] = value;
          this.__updatedField.push(v);
        },
        enumerable: true,
        configurable: true,
      });
    });
    proto.__defined = true;
  }

  /** get prototype's collection name, since this is instance method, proto.__collection must have been set
   */
  getCollectionName() {
    // same doc class should share same collection name too
    const proto = Object.getPrototypeOf(this);
    // proto.__collection =
    //     this.constructor.setCollectionName
    //       ? this.constructor.setCollectionName()
    //       : this.constructor.name.toLowerCase();

    // if (!proto.__collection) {
    //   if (this.constructor.setCollectionName) {
    //     proto.__collection = this.constructor.setCollectionName();
    //   } else {
    //     proto.__collection = this.constructor.name.toLowerCase();
    //   }
    // }
    return proto.__collection;
  }

  /** exposed API for directly dealing with collection instance from native mongodb
   * @param {function} callback function with collection instance as param
   */
  static getCollection(callback) {
    const proto = this.prototype;
    // setDB will do this part
    // if (!proto.__collection) {
    //   if (this.setCollectionName) {
    //     proto.__collection = this.setCollectionName();
    //   } else {
    //     proto.__collection = this.name.toLowerCase();
    //   }
    // }
    if (!proto.__db) { throw new Error(`you haven't set db yet. use ${this.name}.setDB(db) to set one`); }
    proto.__db.getDB((db) => {
      callback(db.collection(proto.__collection));
    });
  }
  static getDB(callback) {
    const proto = this.prototype;
    if (!proto.__db) {
      throw new Error(`you haven't set db yet. use ${this.name}.setDB(db) to set one`);
    }
    proto.__db.getDB((db) => {
      callback(db);
    });
  }

  /**
   * @param {obj} obj is __data field for DOC instance
   */
  static extractPureData(obj) {
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i += 1) {
      if (Object.prototype.hasOwnProperty.call(obj[keys[i]], '__data')) {
        const pureData = Object.assign({}, obj[keys[i]].__data);
        if (pureData._id) delete pureData._id;
        obj[keys[i]] = pureData;
        this.extractPureData(pureData);
      }
    }
  }

  /**
   *
   */
  static extractUpdatedData(obj, updateKV, root) {
    const prefix = root === '' ? '' : `${root}.`;
    if (obj.__updatedField.length > 0) {
      obj.__updatedField.forEach((e) => {
        updateKV[prefix + e] = obj[e];
      });
      obj.__updatedField = [];
    }
    Object.getPrototypeOf(obj).__embedded.forEach((e) => {
      if (obj[e]) {
        obj.constructor.extractUpdatedData(obj[e], updateKV, e);
      }
    });
  }

  /** invoke native mongodb's insertOne
   * return Promise which resolve result param of insertOne's callback
   * reject error param of insertOne's callback
   */
  save() {
    // first time execution of save
    if (!this.__saved) {
      this.__saved = true;
      const self = this;
      const proto = Object.getPrototypeOf(this);
      // this if branch will never occur since save is call via instance which construct procedure will set __collction
      // if (!proto.__collection) this.getCollectionName();
      const inited = proto.__inited;
      if (!self.__checked) {
        self.initCheck();
      }
      if (Object.keys(self.__data).length === 1) {
        throw new Error('you have not defined any data yet before saving');
      }
      const operations = co(function* operation() {
        // this if block createIndex according to schema's unique and sparse setup
        if (!inited) {
          // cancel exposing setup collection's validator API, seems not practical
          // if (self.constructor.setValidator && !validated) {
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
          // }
          if (proto.__unique.length > 0 && proto.__sparse.length > 0) {
            const sparseTemp = proto.__sparse.slice();
            for (let i = 0; i < proto.__unique.length; i += 1) {
              const exist = sparseTemp.indexOf(proto.__unique[i]);
              if (exist > -1) {
                sparseTemp.splice(exist, 1);
                yield self.createIndex(proto.__unique[i], { unique: true, sparese: true });
              } else {
                yield self.createIndex(proto.__unique[i], { unique: true });
              }
            }
            if (sparseTemp.length > 0) {
              for (let i = 0; i < sparseTemp.length; i += 1) {
                yield self.createIndex(sparseTemp[i], { sparse: true });
              }
            }
          }
          if (proto.__unique.length > 0 && proto.__sparse.length === 0) {
            for (let i = 0; i < proto.__unique.length; i += 1) {
              yield self.createIndex(proto.__unique[i], { unique: true });
            }
          }
          if (proto.__unique.length === 0 && proto.__sparse.length > 0) {
            for (let i = 0; i < proto.__sparse.length; i += 1) {
              yield self.createIndex(proto.__sparse[i], { sparse: true });
            }
          }
        }
        const data = Object.assign({}, self.__data);
        self.constructor.extractPureData(data);
        return yield new Promise((resolve, reject) => {
          self.constructor.getCollection((coll) => {
            coll.insertOne(data, (err, result) => {
              if (err) reject(err);
              resolve(result);
            });
          });
        });
      });
      // if (!proto.__inited) {
      proto.__inited = true;
      // }
      return operations;
    }
      // once object has been saved, another save call invokes update instead
    return this.update();
  }

  /** native's update method has been deprected, this method used to save updates on a instance
   */
  update() {
    if (!this.__saved) {
      throw new Error('please save first');
    }
    const updateKV = {};
    this.constructor.extractUpdatedData(this, updateKV, '');

    this.__updatedField = [];
    this.constructor.extractPureData(updateKV);
    return new Promise((resolve, reject) => {
      this.constructor.getCollection((coll) => {
        coll.updateOne({ _id: this.__id }, { $set: updateKV }, (err, result) => {
          if (err) reject(err);
          resolve(result);
        });
      });
    });
  }

  // toString() {
  //  return this.__data.toString()
  // }
  // toJSON() {
  //  return this.__data
  // }
  // valueOf() {
  //  return this.__data
  // }

  addData(dataObj) {
    Object.keys(dataObj).forEach((k) => {
      this[k] = dataObj[k];
    });
  }

  getData() {
    return this.__data;
  }

  /** invoke native mongodb's createIndex
   * return Promise which resolve result param of insertOne's callback
   * reject error param of insertOne's callback
   */
  createIndex(indexDefination, options) {
    return new Promise((resolve, reject) => {
      this.constructor.getCollection((coll) => {
        coll.createIndex(indexDefination, options, (err, result) => {
          if (err) reject(err);
          resolve(result);
        });
      });
    });
  }

  static setDB(db) {
    if (!this.prototype.__db) this.prototype.__db = db;
    if (!this.prototype.__collection) {
      if (this.setCollectionName) {
        this.prototype.__collection = this.setCollectionName();
      } else {
        this.prototype.__collection = this.name.toLowerCase();
      }
    }
  }

  static _checkDBExistence() {
    const proto = this.prototype;
    if (!proto.__db) throw new Error(`No db defined yet, use ${this.name}.setDB(db) to define which db to be used`);
  }


  // the following are commonly used CURD functions
  // 1. CREATE
  // deprecated methods
  static insert() {
    throw new Error('insert is Deprecated: Use insertOne, insertMany or bulkWrite');
  }

  // adopted class methods, adopted means some modification made to check schema before invoking native's methods
  static insertOne(doc) {
    this._checkDBExistence();
    const newdoc = new this(doc);
    return newdoc.save();
  }
  static insertMany(docs, options) {
    this._checkDBExistence();
    // let promises = []
    const insertDocs = [];
    for (let i = 0; i < docs.length; i += 1) {
      new this(docs[i]);
      this.extractPureData(docs[i]);
      insertDocs.push(docs[i]);
      // promises.push(newdoc.save())
    }
    // return Promise.all(promises)
    return new Promise((resolve, reject) => {
      this.prototype.__db.getDB((db) => {
        db.collection(this.prototype.__collection)
          .insertMany(insertDocs, options)
          .then(result => resolve(result))
          .catch(e => reject(e));
      });
    });
  }

  // native driver methods
  static insertOneNative(doc, options) {
    this._checkDBExistence();
    return new Promise((resolve, reject) => {
      this.prototype.__db.getDB((db) => {
        db.collection(this.prototype.__collection)
          .insertOne(doc, options)
          .then(result => resolve(result))
          .catch(e => reject(e));
      });
    });
  }
  static insertManyNative(docs, options) {
    this._checkDBExistence();
    return new Promise((resolve, reject) => {
      this.prototype.__db.getDB((db) => {
        db.collection(this.prototype.__collection)
          .insertMany(docs, options)
          .then(result => resolve(result))
          .catch(e => reject(e));
      });
    });
  }


  // 2. UPDATE
  // adopted class methods, adopted means some modification made to check schema before invoking native's methods
  static replaceOne(filter, doc, options) {
    this._checkDBExistence();
    const newdoc = new this(doc);
    delete newdoc.__data._id;
    this.extractPureData(newdoc.__data);
    return new Promise((resolve, reject) => {
      this.prototype.__db.getDB((db) => {
        db.collection(this.prototype.__collection)
          .replaceOne(filter, newdoc.__data, options)
          .then(result => resolve(result))
          .catch(e => reject(e));
      });
    });
  }
    // due to some update operators' behavior depends on target doc's previous values,
    // this adopted method supports update parameter as plain data object and doesn't support
    // previous value relevant operators: $inc, $mul, $min, $max
    // let's say that a doc has a price field with custom validator 10 < price < 20,
    // its previous value is 19, then {$inc: {price :1}} will obey the validator, but in order to
    // throw a error for this, we have to query it first and do some calculation and comparision
    // then another updateOne operator, this seems unperforment. Let's just throw error when other
    // operator are used right now.
  static updateOne(filter, update, options) {
    this._checkDBExistence();
    this.checkUpdateData(update, 'one');
    return new Promise((resolve, reject) => {
      this.prototype.__db.getDB((db) => {
        db.collection(this.prototype.__collection)
          .updateOne(filter, update, options)
          .then(result => resolve(result))
          .catch(e => reject(e));
      });
    });
  }

  static updateMany(filter, update, options) {
    this._checkDBExistence();
    this.checkUpdateData(update, 'many');
    return new Promise((resolve, reject) => {
      this.prototype.__db.getDB((db) => {
        db.collection(this.prototype.__collection)
          .updateMany(filter, update, options)
          .then(result => resolve(result))
          .catch(e => reject(e));
      });
    });
  }

  // native driver methods
  static replaceOneNative(filter, doc, options) {
    this._checkDBExistence();
    return new Promise((resolve, reject) => {
      this.prototype.__db.getDB((db) => {
        db.collection(this.prototype.__collection)
          .replaceOne(filter, doc, options)
          .then(result => resolve(result))
          .catch(e => reject(e));
      });
    });
  }
  static updateOneNative(filter, update, options) {
    this._checkDBExistence();
    return new Promise((resolve, reject) => {
      this.prototype.__db.getDB((db) => {
        db.collection(this.prototype.__collection)
          .updateOne(filter, update, options)
          .then(result => resolve(result))
          .catch(e => reject(e));
      });
    });
  }
  static updateManyNative(filter, updates, options) {
    this._checkDBExistence();
    return new Promise((resolve, reject) => {
      this.prototype.__db.getDB((db) => {
        db.collection(this.prototype.__collection)
          .updateMany(filter, updates, options)
          .then(result => resolve(result))
          .catch(e => reject(e));
      });
    });
  }


  // 3. READ AND UPDATE
  static findAndModify() {
    throw new Error('findAndModify is deprecated: use findOneAndUpdate, findOneAndReplace or findOneAndDelete instead');
  }
  // adopted class method
  static findOneAndReplace(filter, doc, options) {
    this._checkDBExistence();
    this.checkData(doc);
    return new Promise((resolve, reject) => {
      this.prototype.__db.getDB((db) => {
        db.collection(this.prototype.__collection)
          .findOneAndReplace(filter, doc, options)
          .then((result) => {
            resolve(result.value);
          })
          .catch(e => reject(e));
      });
    });
  }
  static findOneAndUpdate(filter, update, options) {
    this._checkDBExistence();
    this.checkUpdateData(update, 'one');
    return new Promise((resolve, reject) => {
      this.prototype.__db.getDB((db) => {
        db.collection(this.prototype.__collection)
          .findOneAndUpdate(filter, update, options)
          .then((result) => {
            resolve(result.value);
          })
          .catch(e => reject(e));
      });
    });
  }

  // native driver method
  static findOneAndReplaceNative(filter, replaceDoc, options) {
    this._checkDBExistence();
    return new Promise((resolve, reject) => {
      this.prototype.__db.getDB((db) => {
        db.collection(this.prototype.__collection)
          .findOneAndReplace(filter, replaceDoc, options)
          .then(result => resolve(result))
          .catch(e => reject(e));
      });
    });
  }
  static findOneAndUpdateNative(filter, updateDoc, options) {
    this._checkDBExistence();
    return new Promise((resolve, reject) => {
      this.prototype.__db.getDB((db) => {
        db.collection(this.prototype.__collection)
          .findOneAndUpdate(filter, updateDoc, options)
          .then(result => resolve(result))
          .catch(e => reject(e));
      });
    });
  }

  // 4. READ
  static findOne(query, options) {
    this._checkDBExistence();
    return new Promise((resolve, reject) => {
      this.prototype.__db.getDB((db) => {
        db.collection(this.prototype.__collection)
          .findOne(query, options)
          .then((doc) => {
            resolve(doc);
          })
          .catch(e => reject(e));
      });
    });
  }

  // native driver method
  static find(query) {
    this._checkDBExistence();
    return new Promise((resolve, reject) => {
      this.prototype.__db.getDB((db) => {
        try {
          resolve(db.collection(this.prototype.__collection).find(query));
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  static findOneNative(query, options) {
    return this.findOne(query, options);
  }

  // 4. DELETE
  static remove() {
    throw new Error('remove is Deprecated: use deleteOne, deleteMany or bulkWrite');
  }

  // instance method
  delete() {
    if (!this.__saved) throw new Error('you have not saved this object yet, no need to delete');
    return new Promise((resolve, reject) => {
      this.constructor.getCollection((coll) => {
        coll.deleteOne({ _id: this.__id }, (err, result) => {
          if (err) reject(err);
          resolve(result);
        });
      });
    });
  }

  // no need for adding adopted class method, but for convertion, just follow above naming stratage
  static deleteOne(filter, options) {
    this._checkDBExistence();
    return new Promise((resolve, reject) => {
      this.prototype.__db.getDB((db) => {
        db.collection(this.prototype.__collection)
          .deleteOne(filter, options)
          .then((result) => {
            resolve(result);
          })
          .catch(e => reject(e));
      });
    });
  }
  static deleteMany(filter, options) {
    this._checkDBExistence();
    return new Promise((resolve, reject) => {
      this.prototype.__db.getDB((db) => {
        db.collection(this.prototype.__collection)
          .deleteMany(filter, options)
          .then((result) => {
            resolve(result);
          })
          .catch(e => reject(e));
      });
    });
  }
  // native driver method
  static deleteOneNative(filter, options) {
    return this.deleteOne(filter, options);
  }
  static deleteManyNative(filter, options) {
    return this.deleteMany(filter, options);
  }

  // 5. READ AND DELETE
  // deprecated method
  static findAndRemove() {
    throw new Error('findAndRemove is Deprecated: use findOneAndDelete instead');
  }
  // adopted class methods, adopted means some modification made to check schema before invoking native's methods
  static findOneAndDelete(filter, options) {
    this._checkDBExistence();
    return new Promise((resolve, reject) => {
      this.prototype.__db.getDB((db) => {
        // why try block?
        // because mongodbjs will throw MongoError before invoking real db function when filter is invalid
        // this will miss catching the error
        try {
          db.collection(this.prototype.__collection)
            .findOneAndDelete(filter, options)
            .then((result) => {
              resolve(result.value);
            })
            .catch(e => reject(e));
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  // native driver's method
  static findOneAndDeleteNative(filter, options) {
    this._checkDBExistence();
    return new Promise((resolve, reject) => {
      this.prototype.__db.getDB((db) => {
        // why try block?
        // because mongodbjs will throw MongoError before invoking real db function when filter is invalid
        // this will miss catching the error
        try {
          db.collection(this.prototype.__collection)
            .findOneAndDelete(filter, options)
            .then((result) => {
              resolve(result);
            })
            .catch(e => reject(e));
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  // AGGREGATE
  static aggregate(pipeline, options) {
    this._checkDBExistence();
    return new Promise((resolve, reject) => {
      this.prototype.__db.getDB((db) => {
        if (options && options.cursor) {
          resolve(db.collection(this.prototype.__collection).aggregate(pipeline, options));
        } else if (options) {
          db.collection(this.prototype.__collection).aggregate(pipeline, options, (err, result) => {
            if (err) reject(err);
            resolve(result);
          });
        } else {
          db.collection(this.prototype.__collection).aggregate(pipeline, (err, result) => {
            if (err) reject(err);
            resolve(result);
          });
        }
      });
    });
  }
  static mapReduce(map, reduce, options) {
    this._checkDBExistence();
    return new Promise((resolve, reject) => {
      this.prototype.__db.getDB((db) => {
        db.collection(this.prototype.__collection).mapReduce(map, reduce, options, (err, result) => {
          if (err) reject(err);
          resolve(result);
        });
      });
    });
  }
  static count(query, options) {
    this._checkDBExistence();
    return new Promise((resolve, reject) => {
      this.prototype.__db.getDB((db) => {
        db.collection(this.prototype.__collection).count(query, options, (err, result) => {
          if (err) reject(err);
          resolve(result);
        });
      });
    });
  }
  static distinct(key, query, options) {
    this._checkDBExistence();
    return new Promise((resolve, reject) => {
      this.prototype.__db.getDB((db) => {
        db.collection(this.prototype.__collection).distinct(key, query, options, (err, result) => {
          if (err) reject(err);
          resolve(result);
        });
      });
    });
  }
  // BULKWRITE
  static bulkWrite(operations, options) {
    this._checkDBExistence();
    return new Promise((resolve, reject) => {
      this.prototype.__db.getDB((db) => {
        db.collection(this.prototype.__collection).bulkWrite(operations, options, (err, result) => {
          if (err) reject(err);
          resolve(result);
        });
      });
    });
  }
}

module.exports = DOC;

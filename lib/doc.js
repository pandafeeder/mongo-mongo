'use strict';

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _defineProperty4 = require('babel-runtime/core-js/object/define-property');

var _defineProperty5 = _interopRequireDefault(_defineProperty4);

var _preventExtensions = require('babel-runtime/core-js/object/prevent-extensions');

var _preventExtensions2 = _interopRequireDefault(_preventExtensions);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _defineProperties = require('babel-runtime/core-js/object/define-properties');

var _defineProperties2 = _interopRequireDefault(_defineProperties);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _from = require('babel-runtime/core-js/array/from');

var _from2 = _interopRequireDefault(_from);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ObjectID = require('mongodb').ObjectID;
var DB = require('./db');
var co = require('co');
var types = require('./types');
/**
 *
 *
 */

var DOC = function () {
  function DOC() {
    (0, _classCallCheck3.default)(this, DOC);

    if (new.target === DOC) {
      throw new Error('DOC class cannot be instanciated directly, please subclass it first');
    }
    this._parseArguments((0, _from2.default)(arguments));
    this.__checked = false;
    this.__saved = false;
    this.__updatedField = [];
    (0, _getPrototypeOf2.default)(this).__allSetup ? null : this._packProtoProperties();
    this._packProperties();
  }

  /**parse constructor's arugments
   */


  (0, _createClass3.default)(DOC, [{
    key: '_parseArguments',
    value: function _parseArguments(arg) {
      var proto = (0, _getPrototypeOf2.default)(this);
      if (arg.length === 0) {
        this.__data = {};
        this.__id = this.__data._id = ObjectID.createPk();
      } else if (arg.length === 1) {
        if (arg[0] !== undefined) {
          if (arg[0] instanceof DB) {
            proto.__db = proto.__db || arg[0];
            this.__data = {};
            this.__id = this.__data._id = ObjectID.createPk();
          } else if (Object.prototype.toString.call(arg[0]) === '[object Object]') {
            this.__data = arg[0];
            if (!this.__data._id) {
              this.__id = this.__data._id = ObjectID.createPk();
            } else {
              this.__id = this.__data._id;
            }
          } else {
            throw new Error('argument to ' + this.constructor.name + ' must be DB instance or plain data object');
          }
        } else {
          this.__data = {};
          this.__id = this.__data._id = ObjectID.createPk();
        }
      } else if (arg.length === 2) {
        if (!(arg[0] instanceof DB)) {
          throw new Error('your first argument to super is not an DB instance');
        } else {
          proto.__db = proto.__db || arg[0];
        }
        if (arg[1] !== undefined) {
          if (Object.prototype.toString.call(arg[1]) !== '[object Object]') {
            throw new Error('data argument to ' + this.constructor.name + ' must be a plain object');
          }
          this.__data = arg[1];
          if (!this.__data._id) {
            this.__id = this.__data._id = ObjectID.createPk();
          } else {
            this.__id = this.__data._id;
          }
        }
        if (arg[1] === undefined) {
          this.__data = {};
          this.__id = this.__data._id = ObjectID.createPk();
        }
      } else {
        throw new Error('call super() or super(db) or super(db, data) or super(data) first in your constructor');
      }
    }

    /**make these properties unaccessable in enumeration,
     */

  }, {
    key: '_packProperties',
    value: function _packProperties() {
      (0, _defineProperties2.default)(this, {
        __db: { enumerable: false, writable: false, configurable: false },
        __unique: { enumerable: false, writable: false, configurable: false },
        __sparse: { enumerable: false, writable: false, configurable: false },
        __collection: { enumerable: false, writable: false, configurable: false },
        __schema: { enumerable: false, writable: false, configurable: false },
        __default: { enumerable: false, writable: false, configurable: false },
        __requiredButNoDefault: { enumerable: false, writable: false, configurable: false },
        __defined: { enumerable: false, writable: false, configurable: false },
        //__setup true indicates prototype's schema has been setup
        //thus no repeative call for afterwards objects
        __setup: { enumerable: false, writable: false, configurable: false },
        //__inited true indicates createIndex is done
        //thus no repeative call for afterwards objects
        __inited: { enumerable: false, writable: false, configurable: false },
        __checked: { enumerable: false, writable: true },
        __data: { enumerable: false, writable: true },
        __saved: { enumerable: false, writable: true },
        __id: { enumerable: false, writable: true },
        __updatedField: { enumerable: false, writable: true }
      });
    }
  }, {
    key: '_packProtoProperties',
    value: function _packProtoProperties() {
      var proto = (0, _getPrototypeOf2.default)(this);
      proto.__collection = proto.__collection || this.constructor.setCollectionName ? this.constructor.setCollectionName() : this.constructor.name.toLowerCase();

      proto.__schema = proto.__schema || {};
      proto.__requiredButNoDefault = proto.__requiredButNoDefault || [];
      proto.__default = proto.__default || [];
      proto.__unique = proto.__unique || [];
      proto.__sparse = proto.__sparse || [];
      proto.__defined = proto.__defined || false;
      proto.__inited = proto.__inited || false;
      proto.__allSetup = true;
    }

    /**
     * initial check against data params passed in constructor
     */

  }, {
    key: 'initCheck',
    value: function initCheck() {
      var _this = this;

      //skip if obj is constructed with no arguments, then will check inside save
      if ((0, _keys2.default)(this.__data).length > 1) {
        (function () {
          var proto = (0, _getPrototypeOf2.default)(_this);
          proto.__requiredButNoDefault.forEach(function (v) {
            if (!_this.__data.hasOwnProperty(v)) {
              throw new Error(v + ' is required, but not supplied');
            }
          });
          proto.__default.forEach(function (v) {
            if (!_this.__data.hasOwnProperty(v)) {
              _this.__data[v] = proto.__schema[v]['default'];
            }
          });
          (0, _keys2.default)(_this.__data).forEach(function (e) {
            if (e === '_id') return;
            //thorw error for any un-predefined schema
            if (!proto.__schema[e]) throw new Error('no ' + e + ' field in schema');
            _this.singleCheck(proto.__schema[e], _this.__data[e]);
          });
          _this.__checked = true;
        })();
      }
    }

    /**
     * setup prototype's schema, default, requiredButNoDefault and unique properties
     */

  }, {
    key: 'setSchema',
    value: function setSchema(schemaObj) {
      var proto = (0, _getPrototypeOf2.default)(this);
      if (!proto.__setup) {
        if (Object.prototype.toString.call(schemaObj) !== '[object Object]') {
          throw new Error('argument to setSchema function must be an palin object');
        }
        (0, _keys2.default)(schemaObj).forEach(function (e) {
          if (Object.prototype.toString.call(schemaObj[e]) === '[object Object]') {
            (0, _keys2.default)(schemaObj[e]).forEach(function (v) {
              if (['type', 'unique', 'sparse', 'default', 'validator', 'required'].indexOf(v) < 0) {
                throw new Error(v + ' is not supported in schema defination, \n              schema only support type, unique, sparese, default, validator, required currently');
              }
            });
            if (schemaObj[e].required && !schemaObj[e].hasOwnProperty('default')) {
              proto.__requiredButNoDefault.push(e);
            }
            if (schemaObj[e].hasOwnProperty('default')) {
              proto.__default.push(e);
            }
            ['unique', 'sparse'].forEach(function (k) {
              if (schemaObj[e].hasOwnProperty(k)) {
                if (typeof schemaObj[e][k] === 'boolean') {
                  if (schemaObj[e][k]) proto['__' + k].push(e);
                } else {
                  throw new Error('unique must be boolean type');
                }
              }
            });
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
      (0, _preventExtensions2.default)(this);
    }

    /**
     * check schema against input data param, throw Error when not matching
     * @param {dataType} schemaField, schema type, Array, String... or {type: Array/...}
     * @param {data} dataField, the input data corresponding to its schema name
     */

  }, {
    key: 'singleCheck',
    value: function singleCheck(schemaField, dataField) {
      var _this2 = this;

      switch (Object.prototype.toString.call(schemaField)) {
        case '[object Function]':
          if (Object.prototype.toString.call(dataField).slice(8, -1) !== schemaField.name) {
            if (schemaField === types.Int) {
              types.Int(dataField);
            } else if (schemaField === types.Float) {
              types.Float(dataField);
            } else {
              throw new Error(dataField + ' is not ' + schemaField.name);
            }
          }
          break;
        case '[object Object]':
          if (!schemaField.hasOwnProperty('type')) {
            throw new Error('no type constrain defined for ' + schemaField);
          }
          this.singleCheck(schemaField['type'], dataField);
          if (schemaField['validator']) {
            if (typeof schemaField['validator'] !== 'function') {
              throw new Error(schemaField['validator'] + ' must be a function}');
            }
            if (!schemaField['validator'](dataField)) {
              throw new Error(dataField + ' didnot pass validator function');
            }
          }
          break;
        case '[object Array]':
          if (schemaField.length === 0) {
            if (Object.prototype.toString.call(dataField).slice(8, -1) !== 'Array') {
              throw new Error(dataField + ' is not Array');
            }
          } else if (schemaField.length === 1) {
            if (Object.prototype.toString.call(dataField).slice(8, -1) !== 'Array') {
              throw new Error(dataField + ' is not Array');
            }
            dataField.forEach(function (v) {
              _this2.singleCheck(schemaField[0], v);
            });
          } else {
            throw new Error('only [] or [ONE_TYPE_CONSTRAIN] is supported currently');
          }
          break;
        default:
          throw new Error('unrecognized schema type for ' + schemaField);
      }
    }

    /**
     * convert each schema into prototype's propery
     * with descriptor {set:xxx, get:xxx, enumerable:true, configurable:true}
     */

  }, {
    key: 'defineDOCDataProperties',
    value: function defineDOCDataProperties() {
      var proto = (0, _getPrototypeOf2.default)(this);
      (0, _keys2.default)(proto.__schema).forEach(function (v) {
        (0, _defineProperty5.default)(proto, v, {
          get: function get() {
            return this.__data[v];
          },
          set: function set(value) {
            //make sure updated data comply with schema defination
            //call user's custome validator function inside singleCheck
            this.singleCheck(proto.__schema[v], value);
            this.__data[v] = value;
            this.__updatedField.push(v);
          },
          enumerable: true,
          configurable: true
        });
      });
      proto.__defined = true;
    }

    /**set prototype's collection property
     */

  }, {
    key: 'getCollectionName',
    value: function getCollectionName() {
      //same doc class should share same collection name too
      var proto = (0, _getPrototypeOf2.default)(this);
      proto.__collection = this.constructor.setCollectionName ? this.constructor.setCollectionName() : this.constructor.name.toLowerCase();
    }
  }, {
    key: 'getCollection',


    /**exposed API for directly dealing with collection instance from native mongodb
     * @param {function} callback function with collection instance as param
     */
    value: function getCollection(callback) {
      var proto = (0, _getPrototypeOf2.default)(this);
      proto.__collection ? null : this.getCollectionName();
      proto.__db.getDB(function (db) {
        callback(db.collection(proto.__collection));
      });
    }
  }, {
    key: 'getDB',
    value: function getDB(callback) {
      var proto = (0, _getPrototypeOf2.default)(this);
      proto.__db.getDB(function (db) {
        callback(db);
      });
    }

    /**invoke native mongodb's insertOne
     * return Promise which resolve result param of insertOne's callback 
     * reject error param of insertOne's callback
     */

  }, {
    key: 'save',
    value: function save() {
      var _this3 = this;

      //first time execution of save
      if (!this.__saved) {
        var _ret2 = function () {
          _this3.__saved = true;
          var self = _this3;
          var proto = (0, _getPrototypeOf2.default)(_this3);
          proto.__collection ? null : _this3.getCollectionName();
          var inited = proto.__inited;
          if (!proto.__inited) {
            proto.__inited = true;
          }
          var operations = co(_regenerator2.default.mark(function _callee() {
            var sparseTemp, i, exist, _i, _i2, _i3, data;

            return _regenerator2.default.wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    if (!((0, _keys2.default)(self.__data).length === 0)) {
                      _context.next = 2;
                      break;
                    }

                    throw new Error('you have not defined any data yet before saving');

                  case 2:
                    if (inited) {
                      _context.next = 43;
                      break;
                    }

                    if (!(proto.__unique.length > 0 && proto.__sparse.length > 0)) {
                      _context.next = 27;
                      break;
                    }

                    sparseTemp = proto.__sparse.slice();
                    i = 0;

                  case 6:
                    if (!(i < proto.__unique.length)) {
                      _context.next = 19;
                      break;
                    }

                    exist = sparseTemp.indexOf(proto.__unique[i]);

                    if (!(exist > -1)) {
                      _context.next = 14;
                      break;
                    }

                    sparseTemp.splice(exist, 1);
                    _context.next = 12;
                    return self.createIndex((0, _defineProperty3.default)({}, proto.__unique[i], 1), { unique: true, sparese: true });

                  case 12:
                    _context.next = 16;
                    break;

                  case 14:
                    _context.next = 16;
                    return self.createIndex((0, _defineProperty3.default)({}, proto.__unique[i], 1), { unique: true });

                  case 16:
                    i++;
                    _context.next = 6;
                    break;

                  case 19:
                    if (!(sparseTemp.length > 0)) {
                      _context.next = 27;
                      break;
                    }

                    _i = 0;

                  case 21:
                    if (!(_i < sparseTemp.length)) {
                      _context.next = 27;
                      break;
                    }

                    _context.next = 24;
                    return self.createIndex((0, _defineProperty3.default)({}, sparseTemp[_i], 1), { sparse: true });

                  case 24:
                    _i++;
                    _context.next = 21;
                    break;

                  case 27:
                    if (!(proto.__unique.length > 0 && proto.__sparse.length === 0)) {
                      _context.next = 35;
                      break;
                    }

                    _i2 = 0;

                  case 29:
                    if (!(_i2 < proto.__unique.length)) {
                      _context.next = 35;
                      break;
                    }

                    _context.next = 32;
                    return self.createIndex((0, _defineProperty3.default)({}, proto.__unique[_i2], 1), { unique: true });

                  case 32:
                    _i2++;
                    _context.next = 29;
                    break;

                  case 35:
                    if (!(proto.__unique.length === 0 && proto.__sparse.length > 0)) {
                      _context.next = 43;
                      break;
                    }

                    _i3 = 0;

                  case 37:
                    if (!(_i3 < proto.__sparse.length)) {
                      _context.next = 43;
                      break;
                    }

                    _context.next = 40;
                    return self.createIndex((0, _defineProperty3.default)({}, proto.__sparse[_i3], 1), { sparse: true });

                  case 40:
                    _i3++;
                    _context.next = 37;
                    break;

                  case 43:
                    data = (0, _assign2.default)({}, self.__data);
                    _context.next = 46;
                    return new _promise2.default(function (resolve, reject) {
                      self.getCollection(function (coll) {
                        coll.insertOne(data, function (err, result) {
                          if (err) reject(err);
                          resolve(result);
                        });
                      });
                    });

                  case 46:
                    return _context.abrupt('return', _context.sent);

                  case 47:
                  case 'end':
                    return _context.stop();
                }
              }
            }, _callee, this);
          }));
          return {
            v: operations
          };
        }();

        if ((typeof _ret2 === 'undefined' ? 'undefined' : (0, _typeof3.default)(_ret2)) === "object") return _ret2.v;
      } else {
        //once object has been saved, another save call invokes update instead
        this.update();
      }
    }

    /**native's update method has been deprected, this method used to save updates on a instance
     */

  }, {
    key: 'update',
    value: function update() {
      var _this4 = this;

      if (!this.__saved) {
        throw new Error('please save first');
      }
      var updateKV = {};
      this.__updatedField.forEach(function (v) {
        updateKV[v] = _this4[v];
      });
      this.__updatedField = [];
      return new _promise2.default(function (resolve, reject) {
        _this4.getCollection(function (coll) {
          coll.updateOne({ _id: _this4.__id }, { $set: updateKV }, function (err, result) {
            if (err) reject(err);
            resolve(result);
          });
        });
      });
    }

    //toString() {
    //}
    //toJSON() {
    //}

  }, {
    key: 'addData',
    value: function addData(dataObj) {
      var _this5 = this;

      (0, _keys2.default)(dataObj).forEach(function (k) {
        _this5[k] = dataObj[k];
      });
    }
    /**invoke native mongodb's createIndex
     * return Promise which resolve result param of insertOne's callback 
     * reject error param of insertOne's callback
     */

  }, {
    key: 'createIndex',
    value: function createIndex(indexDefination, option) {
      var _this6 = this;

      return new _promise2.default(function (resolve, reject) {
        _this6.getCollection(function (coll) {
          coll.createIndex(indexDefination, option, function (err, result) {
            if (err) reject(err);
            resolve(result);
          });
        });
      });
    }

    /**added method, invoke native's findOne method, returns a new object construced with returned doc by native
     */

  }], [{
    key: 'setCollection',
    value: function setCollection() {
      this.prototype.__collection = this.setCollectionName ? this.setCollectionName() : this.name.toLowerCase();
    }
  }, {
    key: 'findOneAndNew',
    value: function findOneAndNew(query, options) {
      var _this7 = this;

      this._checkDBExistence();
      return new _promise2.default(function (resolve, reject) {
        _this7.prototype.__db.getDB(function (db) {
          db.collection(_this7.prototype.__collection).findOne(query, options).then(function (doc) {
            var obj = new _this7(doc);
            obj.__saved = true;
            resolve(obj);
          }).catch(function (e) {
            return reject(e);
          });
        });
      });
    }
  }, {
    key: 'setDB',
    value: function setDB(db) {
      this.prototype.__db = db;
      this.prototype.__collection ? null : this.setCollection();
    }
  }, {
    key: '_checkDBExistence',
    value: function _checkDBExistence() {
      var proto = this.prototype;
      if (!proto.__db) throw new Error('No db defined yet, use ' + this.name + '.setDB(db) to define which db to be used');
    }
    //the following are commonly used  native's CURD functions
    //1. CREATE

  }, {
    key: 'insert',
    value: function insert() {
      console.warn('insert is Deprecated: use findOneAndDelete instead');
    }
  }, {
    key: 'insertOne',
    value: function insertOne(doc, options) {
      var _this8 = this;

      this._checkDBExistence();
      return new _promise2.default(function (resolve, reject) {
        _this8.prototype.__db.getDB(function (db) {
          db.collection(_this8.prototype.__collection).insertOne(doc, options).then(function (result) {
            return resolve(result);
          }).catch(function (e) {
            return reject(e);
          });
        });
      });
    }
  }, {
    key: 'insertMany',
    value: function insertMany(docs, options) {
      var _this9 = this;

      this._checkDBExistence();
      return new _promise2.default(function (resolve, reject) {
        _this9.prototype.__db.getDB(function (db) {
          db.collection(_this9.prototype.__collection).insertMany(docs, options).then(function (result) {
            return resolve(result);
          }).catch(function (e) {
            return reject(e);
          });
        });
      });
    }

    //2. UPDATE

  }, {
    key: 'findAndModify',
    value: function findAndModify() {
      console.warn('findAndModify is deprecated: use findOneAndUpdate, findOneAndReplace or findOneAndDelete instead');
    }
  }, {
    key: 'replaceOne',
    value: function replaceOne(filter, doc, options, callback) {
      var _this10 = this;

      this._checkDBExistence();
      return new _promise2.default(function (resolve, reject) {
        _this10.prototype.__db.getDB(function (db) {
          db.collection(_this10.prototype.__collection).replaceOne(filter, doc, options, callback).then(function (result) {
            return resolve(result);
          }).catch(function (e) {
            return reject(e);
          });
        });
      });
    }
  }, {
    key: 'updateOne',
    value: function updateOne(filter, update, options, callback) {
      var _this11 = this;

      this._checkDBExistence();
      return new _promise2.default(function (resolve, reject) {
        _this11.prototype.__db.getDB(function (db) {
          db.collection(_this11.prototype.__collection).updateOne(filter, update, options, callback).then(function (result) {
            return resolve(result);
          }).catch(function (e) {
            return reject(e);
          });
        });
      });
    }
  }, {
    key: 'updateMany',
    value: function updateMany(filter, update, options, callback) {
      var _this12 = this;

      this._checkDBExistence();
      return new _promise2.default(function (resolve, reject) {
        _this12.prototype.__db.getDB(function (db) {
          db.collection(_this12.prototype.__collection).updateMany(filter, update, options, callback).then(function (result) {
            return resolve(result);
          }).catch(function (e) {
            return reject(e);
          });
        });
      });
    }
  }, {
    key: 'findOneAndReplace',
    value: function findOneAndReplace(filter, replacement, options) {
      var _this13 = this;

      this._checkDBExistence();
      return new _promise2.default(function (resolve, reject) {
        _this13.prototype.__db.getDB(function (db) {
          db.collection(_this13.prototype.__collection).findOneAndReplace(filter, replacement, options).then(function (result) {
            resolve(result);
          }).catch(function (e) {
            return reject(e);
          });
        });
      });
    }
  }, {
    key: 'findOneAndUpdate',
    value: function findOneAndUpdate(filter, update, options, callback) {
      var _this14 = this;

      this._checkDBExistence();
      return new _promise2.default(function (resolve, reject) {
        _this14.prototype.__db.getDB(function (db) {
          db.collection(_this14.prototype.__collection).findOneAndUpdate(filter, update, options, callback).then(function (result) {
            resolve(result);
          }).catch(function (e) {
            return reject(e);
          });
        });
      });
    }

    //3. READ

  }, {
    key: 'find',
    value: function find(query) {
      var _this15 = this;

      this._checkDBExistence();
      return new _promise2.default(function (resolve, reject) {
        _this15.prototype.__db.getDB(function (db) {
          try {
            resolve(db.collection(_this15.prototype.__collection).find(query));
          } catch (e) {
            reject(e);
          }
        });
      });
    }
  }, {
    key: 'findOne',
    value: function findOne(query, option) {
      var _this16 = this;

      this._checkDBExistence();
      return new _promise2.default(function (resolve, reject) {
        _this16.prototype.__db.getDB(function (db) {
          db.collection(_this16.prototype.__collection).findOne(query, option).then(function (doc) {
            resolve(doc);
          }).catch(function (e) {
            return reject(e);
          });
        });
      });
    }

    //4. DELETE

  }, {
    key: 'findAndRemove',
    value: function findAndRemove() {
      console.warn('findAndRemove is Deprecated: use findOneAndDelete instead');
    }
  }, {
    key: 'remove',
    value: function remove() {
      console.warn('remove is Deprecated: use deleteOne, deleteMany or bulkWrite');
    }
  }, {
    key: 'findOneAndDelete',
    value: function findOneAndDelete(filter, options) {
      var _this17 = this;

      this._checkDBExistence();
      return new _promise2.default(function (resolve, reject) {
        _this17.prototype.__db.getDB(function (db) {
          db.collection(_this17.prototype.__collection).findOneAndDelete(filter, option).then(function (result) {
            resolve(result);
          }).catch(function (e) {
            return reject(e);
          });
        });
      });
    }
  }]);
  return DOC;
}();

module.exports = exports = DOC;
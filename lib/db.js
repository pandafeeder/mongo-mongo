'use strict';

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var thunky = require('thunky');
var MongoClient = require('mongodb').MongoClient;

var DB = function DB(uri, option) {
  var _this = this;

  (0, _classCallCheck3.default)(this, DB);

  this.uri = uri;
  this.option = option;
  this.getDB = thunky(function (cb) {
    MongoClient.connect(_this.uri, _this.option, function (err, db) {
      if (err) throw err;
      return cb(db);
    });
  });
};

module.exports = exports = DB;
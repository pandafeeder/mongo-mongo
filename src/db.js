const thunky = require('thunky');
const MongoClient = require('mongodb').MongoClient;

class DB {
  constructor(uri, option) {
    this.uri = uri;
    this.option = option;
    this.getDB = thunky((cb) => {
      MongoClient.connect(this.uri, this.option, (err, db) => {
        if (err) throw err;
        return cb(db);
      });
    });
  }
}

module.exports = DB;

/**
 * Created by sergey on 29.03.15.
 */

var MongoClient = require('mongodb').MongoClient;
var utils = require('../utils');
var async = require('async');
_ = require('underscore');

MongoClient.connect('mongodb://127.0.0.1:27017/ftsTest', function(err, db) {

    var collections = {
        firm: {
            dba: null,
            schema: {
                amount: 10,
                created: new Date(),
                firm: 'firm name',
                startNum: 0
            }
        },
        count: {
            dba: null,
            schema: {
                name: 'count name',
                sysNumber: null,
                created: new Date()
            }
        }
    };

    async.waterfall([
            function(callback) {
                db.dropDatabase();
                collections.firm.dba = db.collection('firms');
                collections.count.dba = db.collection('counts');
                callback(null);
            },
            function(callback) {
                collections.firm.dba.insertOne(collections.firm.schema, callback)
            },
            function(res, callback) {

                var i = 0;

                async.whilst(
                    function() {
                        return i<3;
                    },
                    function(cb) {
                        collections.count.dba.insertOne(_.defaults({firm: res.ops[0]._id}, collections.count.schema), function(err, res) {
                            cb(null, i++);
                        });
                    },
                    function(err) {
                        if (err) return callback(err);
                        collections.count.dba.find({}).toArray(function(err, res) {
                            callback(null, res);
                        });
                    }
                )

            },
            function(res, callback) {
                console.assert(res.length == 3);
                callback(null, res)
            },
            function(res, callback) {
                var hash = utils.toHash(res);

                console.assert(_.isArray(hash));
                console.assert(hash.length == 1);
                console.assert(_.has(hash[0], 'counts'));
                console.assert(hash[0].counts.length == 3);


                var counts = utils.excludeNumerable(hash[0].counts);
                console.assert(counts.length == 3);

                counts[0].sysNumber = 10;
                var reCounts = utils.excludeNumerable(hash[0].counts.slice(0));
                console.assert(reCounts.length == 2);

                utils.update(counts, 10, db, function(err, res) {
                    callback(null, res);
                });
            },
            function(res, callback) {
                collections.count.dba.find({}).toArray(function(err, res) {
                    console.log(res);
                    callback(null)
                })
            }
        ],
        function(callback) {
            console.log('end tests');
            db.close();
        });
});

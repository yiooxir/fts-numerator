/**
 * Created by sergey on 28.03.15.
 */

var MongoClient = require('mongodb').MongoClient;
var utils = require('./utils');
_ = require('underscore');
var async = require('async');

MongoClient.connect('mongodb://127.0.0.1:27017/fts', function(err, db) {
    if (err) throw Error(err);

    async.waterfall([
        function(callback) {
            var collection = db.collection('counts');
            var cursor = collection.find({});

            cursor.toArray(callback);
        },
        function(counts, callback) {
            var res = utils.toHash(counts);
            var collection = db.collection('firms');
            var cursor = collection.find({});

            cursor.toArray(function(err, firms) {
                if (err) callback(err);
                callback(null , res, firms);
            });
        },
        function(hash, firms, callback) {

            _.each(firms, function(f) {f._id= f._id.toString()});

            function getStartNum(firmId) {
                return _.findWhere(firms, {_id: firmId}).startNum;
            }
            _.each(hash, function(e) {

                var maxNum = _.max(e.counts, function(f) {return f.sysNumber}).sysNumber;
                e.next = maxNum ? maxNum + 1 : getStartNum(e.firm) || 1;

            });

            _.each(hash, function(e) {
                e.counts = utils.excludeNumerable(e.counts);
            });

            callback(null, hash);
        },

        function(hash, callback) {

            var i = 0,
                len = hash.length;

            if (!len) return callback(null, hash);

            async.whilst(
                function() {
                    return i < len;
                },
                function(cb) {
                    utils.update(hash[i].counts, hash[i].next, db, function(err) {
                        if (err) return cb(err);
                        cb(null, i++);
                    });
                },

                function(err) {
                    if (err) return callback(err);
                    callback(null, hash);
                }
            )
        }

    ], function(err) {
        console.log('END');
        db.close();
    });

});

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

            _.each(hash, function(e) {

                var firm = _.findWhere(firms, {_id: e.firm});
                if (!firm) throw Error('firm not found');

                var maxNum = _.max(e.counts, function(f) {return f.sysNumber}).sysNumber;
                e.next = maxNum ? maxNum + 1 : firm.startNum;

            });

            _.each(hash, function(e) {
                utils.excludeNumerable(e.counts);
            });

            callback(null, hash);
        },
        function() {

        }
    ], function(err, res) {
        console.log('>>',res);
        db.close();
    });

});
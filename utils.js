/**
 * Created by sergey on 28.03.15.
 */

var async = require('async');

module.exports = {
    _reStructure: function(objects) {
        var res = [];
        _.each(objects, function(value, key) {
            res.push({
                firm: key,
                counts: value
            })
        });

        return res;
    },

    toHash: function(objects) {
        /* order by date */
        objects = _.sortBy(objects, function(e) {return e.created});
        /* group by firm */
        var res = _.groupBy(objects, function(e) {return e.firm});
        /* create new structure */
        res = this._reStructure(res);

        return res;
    },

    excludeNumerable: function(objects) {
        return _.filter(objects, function(e) {return !e.sysNumber});
    },

    update: function(counts, next, db, callback) {

        var i = 0,
            len = counts.length,
            collection = db.collection('counts');

        if (!len) return callback(null, counts);

        async.whilst(
            function() {
                return i < len;
            },
            function(cb) {
                collection.updateOne(
                    {_id: counts[i]._id},
                    {$set: {sysNumber: next+i}},
                    function(err) {
                        if(err) cb(err);
                        cb(null, i++);
                    })
            },
            function(err) {
                if (err) callback(err);
                callback(null, counts);
            }
        )
    }
};

/**
 * Created by sergey on 28.03.15.
 */


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

    _validate: function(objects) {
        _.each(objects, function(e) {
            if (!_.has(e, 'sysNumber')) {
                e.sysNumber = 0;
            }
        });
        return objects;
    },


    toHash: function(objects) {
        objects = this._validate(objects);
        objects = _.sortBy(objects, function(e) {return e.created});
        var res = _.groupBy(objects, function(e) {return e.firm});
        res = this._reStructure(res);

        return res;
    },

    excludeNumerable: function(objects) {
        _.each(objects, function(e, i) {
            if (e.sysNumber) objects.splice(i, 1);
        });

        return objects;
    }
};
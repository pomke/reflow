var assert    = require('assert');
var reflow = require('../index');

describe("Reflow", function() {


    var testBucket = {};

    function waitFor(attr, value, callback) {
        function wait() {
            if(!testBucket.hasOwnProperty(attr)) {
                setTimeout(wait, 200);
            } else {
                assert.equal(testBucket[attr], value);
                callback(null);
            }
        }
        wait();
    }


    var workflow = {
        one : {
            two : {
                conditions : [oneToTwoCond1, oneToTwoCond2],
                triggers : [oneToTwoTrigger1, oneToTwoTrigger2]
            }
        },

        two : {
            three : {
                triggers : [failTrigger]
            }
        },

        three : {
            one : {
                conditions : [failCondition]
            }
        }
    };

    function oneToTwoCond1(obj, target, cb) {
        testBucket.oneToTwoCond1 = true;
        cb(null, true);
    }

    function oneToTwoCond2(obj, target, cb) {
        testBucket.oneToTwoCond2 = true;
        cb(null, true);
    }

    function oneToTwoTrigger1(obj) {
        testBucket.oneToTwoTrigger1 = true;
    }

    function oneToTwoTrigger2(obj) {
        testBucket.oneToTwoTrigger2 = true;
    }

    function failCondition(obj, target, cb) {
        testBucket.failCondition = true;
        cb(null, false);
    }

    function failTrigger(obj, context) {
        assert.equal(context.context, true);
        testBucket.failTrigger = true;
    }

    function get(o, callback) {
        callback(null, o.state);
    };

    function set(o, state, callback) {
        o.state = state;
        callback(null);
    };

    var transition = reflow(get, set, workflow);
    var obj = {state : 'one'};

    it("should not perform an invalid transition", function(done) {
        transition(obj, 'three', function(err){
            assert(err, true);
            done();
        });
    });

    it("should perform a valid transition with passing conditions and triggers", function(done) {
        transition(obj, 'two', function(err){
            assert.equal(err, undefined);
            assert.equal(testBucket.oneToTwoCond1, true);
            assert.equal(testBucket.oneToTwoCond2, true);
            waitFor('oneToTwoTrigger1', true, function() {
                waitFor('oneToTwoTrigger2', true, function() {
                    assert.equal(obj.state, 'two');
                    done();
                });
            });
        });
    });

    it("should perform a valid transition with a failing trigger", function(done) {
        transition(obj, 'three', function(err){
            assert.equal(obj.state, 'three');
            done();
        }, {context : true});
    });

    it("should fail to transition a valid transition with conditions that fail", function(done) {
        transition(obj, 'one', function(err){
            assert.equal(err.length, 1);
            assert.equal(obj.state, 'three');
            done();
        });
    });



});


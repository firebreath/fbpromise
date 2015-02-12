(function() {
var global=this;
var toString = Object.prototype.toString;
// Shamelessly borrowed from underscore.js
function isObject(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
}
var isFunction = function (obj) { return toString.call(obj) === '[object Function]'; };
// Optimize `isFunction` if appropriate. Work around an IE 11 bug. Pulled from underscore.js
if (typeof /./ !== 'function') {
    isFunction = function(obj) { return typeof obj == 'function' || false; };
}
function defer(fn, arg) { setTimeout(function() { fn(arg); }, 0); }
function isThennable(x) { return (isObject(x) && isFunction(x.then)); }

var STATES = { PEND: 1, RESOLVE: 2, REJECT: 3 };

function DeferredObject() {
    var self=this;
    var fulfillHandlers = [];
    var rejectHandlers = [];
    var state = STATES.PEND;
    var value;

    this.promise = {
        then: function(onFulfilled, onRejected) {
            var promise2 = new DeferredObject();
            function makeCallback(cbFunc) {
                return function handleCallback(value) {
                    try {
                        var x = cbFunc(value);
                        promise2.resolve(x);
                    } catch (e) {
                        promise2.reject(e);
                    }
                };
            }
            if (state === STATES.RESOLVE && isFunction(onFulfilled)) {
                makeCallback(onFulfilled)(value);
            } else if (state === STATES.REJECT && isFunction(onRejected)) {
                makeCallback(onRejected)(value);
            } else {
                if (isFunction(onFulfilled)) {
                    fulfillHandlers.push(makeCallback(onFulfilled));
                }
                if (isFunction(onRejected)) {
                    rejectHandlers.push(makeCallback(onRejected));
                }
            }
            return promise2.promise;
        }
    };

    this.resolve = function(x) {
        if (x === self) {
            self.reject(new Error("TypeError"));
        } else if (state !== STATES.PEND) {
            return; // ignore multiple calls
        } else if (isThennable(x)) {
            try {
                x.then(self.resolve, self.reject);
            } catch (e) {
                self.reject(e);
            }
        } else {
            value = x;
            state = STATES.RESOLVE;
            for (var i = 0; i < fulfillHandlers; ++i) {
                defer(fulfillHandlers[i], value);
            }
        }
    };

    this.reject = function(x) {
        if (x === self) {
            self.reject(new Error("TypeError"));
        } else if (state !== STATES.PEND) {
            return; // ignore multiple calls
        } else {
            value = x;
            state = STATES.REJECT;
            for (var i = 0; i < fulfillHandlers; ++i) {
                defer(fulfillHandlers[i], value);
            }
        }
    };
}
function makeDeferred() {
    return new DeferredObject();
}
this.FireBreathPromise = makeDeferred;
}).call((module && module.exports) ? module.exports : this);

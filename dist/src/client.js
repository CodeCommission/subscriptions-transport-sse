'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SubscriptionClient = undefined;

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

exports.addGraphQLSubscriptions = addGraphQLSubscriptions;

var _printer = require('graphql/language/printer');

var _lodash = require('lodash');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var SubscriptionClient = exports.SubscriptionClient = function () {
  function SubscriptionClient(url, httpOptions) {
    (0, _classCallCheck3.default)(this, SubscriptionClient);
    this.subscriptions = {};
    var timeout = httpOptions.timeout;

    this.url = url;
    this.httpTimeout = timeout;
  }

  (0, _createClass3.default)(SubscriptionClient, [{
    key: 'subscribe',
    value: function subscribe(options, handler) {
      var _this = this;

      var query = options.query,
          variables = options.variables,
          operationName = options.operationName,
          context = options.context;

      if (!query) throw new Error('Must provide `query` to subscribe.');
      if (!handler) throw new Error('Must provide `handler` to subscribe.');
      if (!(0, _lodash.isString)(query) || operationName && !(0, _lodash.isString)(operationName) || variables && !(0, _lodash.isObject)(variables)) throw new Error('Incorrect option types to subscribe. `subscription` must be a string, `operationName` must be a string, and `variables` must be an object.');

      return fetch(this.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: (0, _stringify2.default)(options),
        timeout: this.httpTimeout || 1000
      }).then(function (res) {
        return res.json();
      }).then(function (data) {
        var subId = data.subId;
        var evtSource = new EventSource(_this.url + '/' + subId);
        _this.subscriptions[subId] = { options: options, handler: handler, evtSource: evtSource };

        evtSource.onmessage = function (e) {
          var message = JSON.parse(e.data);

          switch (message.type) {
            case 'SUBSCRIPTION_DATA':
              _this.subscriptions[subId].handler(null, message.data);
              break;
          }

          // TODO: cleanup subscription + reconnect
          evtSource.onerror = function (e) {
            return console.error('EventSource connection failed for subscription ID: ' + subId + '.');
          };
        };
        return subId;
      });
    }
  }, {
    key: 'unsubscribe',
    value: function unsubscribe(subscription) {
      var _this2 = this;

      subscription.then(function (subId) {
        if (_this2.subscriptions[subId] && _this2.subscriptions[subId].evtSource) {
          _this2.subscriptions[subId].evtSource.close();
        }
        delete _this2.subscriptions[subId];
      });
    }
  }, {
    key: 'unsubscribeAll',
    value: function unsubscribeAll() {
      var _this3 = this;

      (0, _keys2.default)(this.subscriptions).forEach(function (subId) {
        _this3.unsubscribe(parseInt(subId));
      });
    }
  }]);
  return SubscriptionClient;
}();

// Quick way to add the subscribe and unsubscribe functions to the network interface


function addGraphQLSubscriptions(networkInterface, spdyClient) {
  return (0, _assign2.default)(networkInterface, {
    subscribe: function subscribe(request, handler) {
      return spdyClient.subscribe({
        query: (0, _printer.print)(request.query),
        variables: request.variables
      }, handler);
    },
    unsubscribe: function unsubscribe(id) {
      spdyClient.unsubscribe(id);
    }
  });
}
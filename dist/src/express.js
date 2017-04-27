'use strict';

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var EventEmitter = require('events');

module.exports = {
  SubscriptionServer: SubscriptionServer
};

function SubscriptionServer(subscriptionOptions, connectionOptions) {
  var subscriptionManager = subscriptionOptions.subscriptionManager,
      onSubscribe = subscriptionOptions.onSubscribe,
      onUnsubscribe = subscriptionOptions.onUnsubscribe,
      onConnect = subscriptionOptions.onConnect,
      onDisconnect = subscriptionOptions.onDisconnect,
      keepAlive = subscriptionOptions.keepAlive;

  if (!subscriptionManager) throw new Error('Must provide `subscriptionManager` to SSE server constructor.');

  var emitter = new EventEmitter();
  emitter.setMaxListeners(0);

  connectionOptions.express.post(connectionOptions.path, function (req, res) {
    var subscription = (0, _assign2.default)(req.body, subscriptionOptions.onSubscribe());
    var connectionSubscriptionId = 0;

    subscription.callback = function (error, data) {
      emitter.emit('event-' + connectionSubscriptionId, error, data);
    };

    subscriptionOptions.subscriptionManager.subscribe(subscription).then(function (subId) {
      connectionSubscriptionId = subId;
      res.send({ subId: subId });
    });
  });

  connectionOptions.express.get(connectionOptions.path + '/:id', function (req, res) {
    var connectionSubscriptionId = req.params.id;
    res.setHeader('Content-Type', 'text/event-stream');

    req.connection.on('close', function () {
      if (subscriptionOptions.subscriptionManager.subscriptions[connectionSubscriptionId]) subscriptionOptions.subscriptionManager.unsubscribe(connectionSubscriptionId);
    });

    emitter.on('event-' + connectionSubscriptionId, function (error, data) {
      res.write('data: ' + (0, _stringify2.default)({ type: 'SUBSCRIPTION_DATA', subId: connectionSubscriptionId, data: data.data }) + '\n\n');
    });

    res.write('data: ' + (0, _stringify2.default)({ type: 'SUBSCRIPTION_SUCCESS', subId: connectionSubscriptionId }) + '\n\n');
  });
}
const EventEmitter = require('events')

module.exports = {
  SubscriptionServer: SubscriptionServer,
}

function SubscriptionServer(subscriptionOptions, connectionOptions) {
  const {subscriptionManager, onSubscribe, onUnsubscribe, onConnect, onDisconnect, keepAlive} = subscriptionOptions;
  if (!subscriptionManager) throw new Error('Must provide `subscriptionManager` to SSE server constructor.');

  const emitter = new EventEmitter()
  emitter.setMaxListeners(0)

  connectionOptions.express.post(connectionOptions.path, (req, res) => {
    const subscription = Object.assign(req.body, subscriptionOptions.onSubscribe())
    let connectionSubscriptionId = 0

    subscription.callback = (error, data) => {
      emitter.emit(`event-${connectionSubscriptionId}`, error, data)
    }

    subscriptionOptions.subscriptionManager
    .subscribe(subscription)
    .then(subId => {
      connectionSubscriptionId = subId
      res.send({subId: subId})
    })
  })

  connectionOptions.express.get(`${connectionOptions.path}/:id`, (req, res) => {
    const connectionSubscriptionId = req.params.id
    res.setHeader('Content-Type', 'text/event-stream')

    req.connection.on('close', () => {
      if(subscriptionOptions.subscriptionManager.subscriptions[connectionSubscriptionId]) subscriptionOptions.subscriptionManager.unsubscribe(connectionSubscriptionId)
    })

    emitter.on(`event-${connectionSubscriptionId}`, (error, data) => {
      res.write(`data: ${JSON.stringify({type: 'SUBSCRIPTION_DATA', subId: connectionSubscriptionId, data: data.data})}\n\n`)
    })

    res.write(`data: ${JSON.stringify({type: 'SUBSCRIPTION_SUCCESS', subId: connectionSubscriptionId})}\n\n`)
  })
}

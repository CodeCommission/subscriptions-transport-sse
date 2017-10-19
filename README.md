# subscriptions-transport-sse

A GraphQL Server-Side-Evenet (SSE) server and client to facilitate GraphQL subscriptions.

> That's an API compatible SSE transport implementation of [subscriptions-transport-ws](https://github.com/apollographql/subscriptions-transport-ws).

## Example

* [GraphQL subscriptions over Server-Side-Events](https://github.com/MikeBild/graphql-subscriptions-sse-presence-list)

## Getting Started

```bash
Using Yarn:
$ yarn add subscriptions-transport-sse

Or, using NPM:
$ npm install --save subscriptions-transport-sse
```

### ExpressJS Server

Starting with the server, create a new simple SubscriptionsManager, with a PubSub implementation:

```javascript
import { SubscriptionManager, PubSub } from 'graphql-subscriptions'

const schema = {} // Replace with your GraphQL schema object
const pubsub = new PubSub()

const subscriptionManager = new SubscriptionManager({
  schema,
  pubsub
})
```

Now, use your subscriptionManager, and create your SubscriptionServer:

```javascript
const express = require('express')
const app = express()
const expressGraphQLSubscriptionsSSETransport = require('subscriptions-transport-sse')

expressGraphQLSubscriptionsSSETransport.SubscriptionServer({
  onSubscribe: (msg, params) => Object.assign({}, params, { context: { loaders: loaders(), } }),
  subscriptionManager: graphqlSubscriptions.subscriptionManager,
}, {
  express: app,
  path: '/subscriptions',
})

app.listen(SERVICE_PORT, () => console.log(`Listen on ${SERVICE_PORT}`))
```

### Apollo Client (Browser)

For client side, we will use SubscriptionClient, and we also need to extend our network interface to use this transport for GraphQL subscriptions:

```javascript
import { SubscriptionClient, addGraphQLSubscriptions } from 'subscriptions-transport-sse'
const httpClient = createNetworkInterface({uri: `https://my-graphql.example.com/graphql`})
const sseClient = new SubscriptionClient(`https://my-graphql.example.com/subscriptions`)
const apolloClient = new ApolloClient({networkInterface: addGraphQLSubscriptions(httpClient, sseClient)})
```

Now, when you want to use subscriptions in client side, use your ApolloClient instance, with subscribe or subscribeToMore (according to your apollo-client usage):

```javascript
apolloClient.subscribeToMore({
    document: gql`
        subscription onNewItem {
            newItemCreated {
                id
            }
        }`,
    variables: {},
    updateQuery: (prev, {subscriptionData}) => {
        return; // Modify your store and return new state with the new arrived data
    }
});
```

## API

> TBD, but compatible with [subscriptions-transport-ws](https://github.com/apollographql/subscriptions-transport-ws).

## Issue Reporting

If you have found a bug or if you have a feature request, please report them at this repository issues section. Please do not report security vulnerabilities on the public [GitHub issue tracker](https://github.com/MikeBild/subscriptions-transport-sse/issues).

## License

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for more info.

## Thanks

You like this __subscriptions-transport-sse__ and you want to see what coming next? Follow me on Twitter [`@mikebild`](https://twitter.com/mikebild).

Enjoy!

# subscriptions-transport-sse

**(Work in progress!)**

A GraphQL Server-Side-Evenet (SSE) server and client to facilitate GraphQL subscriptions.

> This is a API compatible SSE transport implementation of [subscriptions-transport-ws](https://github.com/apollographql/subscriptions-transport-ws).

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
const expressGraphQLSubscriptionsSSETransport = require('subscriptions-transport-sse').express

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
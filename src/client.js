import EventSource from 'eventsource';
import {print} from 'graphql/language/printer';
import isString from 'lodash.isstring';
import isObject from 'lodash.isobject';

export class SubscriptionClient {
  constructor(url, httpOptions) {
    this.httpOptions = httpOptions;
    this.url = url;
    this.subscriptions = {};
  }

  subscribe(options, handler) {
    const {timeout, headers} =
      typeof this.httpOptions === 'function'
        ? this.httpOptions()
        : this.httpOptions;

    const {query, variables, operationName, context} = options;
    if (!query) throw new Error('Must provide `query` to subscribe.');
    if (!handler) throw new Error('Must provide `handler` to subscribe.');
    if (
      !isString(query) ||
      (operationName && !isString(operationName)) ||
      (variables && !isObject(variables))
    )
      throw new Error(
        'Incorrect option types to subscribe. `subscription` must be a string, `operationName` must be a string, and `variables` must be an object.'
      );

    return fetch(this.url, {
      method: 'POST',
      headers: Object.assign({}, headers, {
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify(options),
      timeout: timeout || 1000
    })
      .then(res => res.json())
      .then(data => {
        const subId = data.subId;

        const evtSource = new EventSource(`${this.url}/${subId}`, {
          headers
        });
        this.subscriptions[subId] = {options, handler, evtSource};

        evtSource.onmessage = e => {
          const message = JSON.parse(e.data);
          switch (message.type) {
            case 'SUBSCRIPTION_DATA':
              this.subscriptions[subId].handler(null, message.data);
              break;
            case 'KEEPALIVE':
              break;
          }

          evtSource.onerror = e => {
            console.error(
              `EventSource connection failed for subscription ID: ${
                subId
              }. Retry.`
            );
            if (
              this.subscriptions[subId] &&
              this.subscriptions[subId].evtSource
            ) {
              this.subscriptions[subId].evtSource.close();
            }
            delete this.subscriptions[subId];
            setTimeout(() => this.subscribe(options, handler), 1000);
          };
        };
        return subId;
      })
      .catch(error => {
        console.error(`${error.message}. Subscription failed. Retry.`);
        setTimeout(() => this.subscribe(options, handler), 1000);
      });
  }

  unsubscribe(subscription) {
    subscription.then(subId => {
      if (this.subscriptions[subId] && this.subscriptions[subId].evtSource) {
        this.subscriptions[subId].evtSource.close();
      }
      delete this.subscriptions[subId];
    });
  }

  unsubscribeAll() {
    Object.keys(this.subscriptions).forEach(subId => {
      this.unsubscribe(parseInt(subId));
    });
  }

  publish(subscription, data) {
    const {timeout, headers} =
      typeof this.httpOptions === 'function'
        ? this.httpOptions()
        : this.httpOptions;

    return subscription.then(subId =>
      fetch(`${this.url}/publish/${subId}`, {
        method: 'POST',
        headers: Object.assign({}, headers, {
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify(data),
        timeout: timeout || 1000
      })
    );
  }
}

export function addGraphQLSubscriptions(networkInterface, spdyClient) {
  return Object.assign(networkInterface, {
    subscribe(request, handler) {
      return spdyClient.subscribe(
        {
          query: print(request.query),
          variables: request.variables
        },
        handler
      );
    },
    unsubscribe(id) {
      spdyClient.unsubscribe(id);
    }
  });
}

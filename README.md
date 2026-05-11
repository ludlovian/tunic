# tunic
Between outerwear and underwear, you can find handy middle-~~wear~~ware.

## bodySnatcher ( [options] ) => _middleware_

Creates a middleware that gathers the request body and places it on `req.body`.
Will `JSON.parse` if the content is set to `application/json`

Options include:

Option | Meaning
--- | ---
method | The method, or array of methods, for which to do this. Default: `POST`
json | If set, then always try to decode json, regardless of the sent Content-Type

## cashless () => _middleware_

Will tell the client not to cache anything

## cors () => _middleware_

Adds all the CORS headers

## sendJson () => _middleware_

Adds `res.sendJson(jsonData)` which will handle sending out JSON responses,
including `gzip` if acceptable to the client.

## sendEventStream (opts) => _middleware_

Adds `res.sendEventStream` to send Server Sent Events. Will send a heartbeat
comment if idle for long enough to stop the client disconnecting.

Options on the factory function are:

Option | Meaning
--- | ---
defaultHeartbeat | The standard idle heartbeat period (default 30s)
heartbeatName | the search param that can be used to override this (default: 'hb')
event | What custom event name to use. Default is undefined

The created `sendEventStream` function should be called with signature:

```js
sendEventStream(generator[, options])
```

Where the options are:

Option | Meaning
--- | ---
abort | a function called to stop the generator instead of calling `.return` on it

The supplied generator should yield UTF8 text, possibly containing `\n`
if multiple lines. These are then sent out to the client.

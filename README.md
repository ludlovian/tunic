# tunic
Between outerwear and underwear, you can find handy middle-~~wear~~ware.

## bodySnatcher ( [options] ) => _middleware_

Creates a middleware that gathers the request body and places it on `req.body`. Will `JSON.parse` if the content is set to `application/json`

Options include:

Option | Meaning
--- | ---
method | The method, or array of methods, for which to do this. Default: `POST`

## cashless () => _middleware_

Will tell the client not to cache anything

## cors () => _middleware_

Adds all the CORS headers

## sendJson () => _middleware_

Adds `res.sendJson` which will handle sending out JSON responses, including `gzip` if acceptable.

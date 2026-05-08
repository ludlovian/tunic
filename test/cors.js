import test from 'node:test'
import assert from 'node:assert/strict'

import { cors } from '@ludlovian/tunic'

test('cors', t => {
  let req
  let res
  let next
  t.beforeEach(t => {
    req = { method: '', headers: {} }
    res = {
      statusCode: 200,
      headers: {},
      writeHead (code, headers) {
        this.code = code
        for (const k in headers) {
          this.headers[k.toLowerCase()] = headers[k]
        }
        return this
      },
      setHeader (k, v) {
        this.headers[k.toLowerCase()] = v
        return this
      },
      end: t.mock.fn()
    }
    next = t.mock.fn()
  })

  test('preflight options with reflected origin', async t => {
    req.method = 'OPTIONS'
    req.headers.origin = 'foo'

    const ware = cors()
    await ware(req, res, next)

    assert.equal(res.code, 204)
    assert.deepEqual(res.headers, {
      'access-control-allow-origin': 'foo',
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'Content-Type',
      'access-control-allow-private-network': true,
      vary: 'Origin, Accept-Encoding, Content-Type'
    })
    assert.equal(next.mock.callCount(), 0)
    assert.equal(res.end.mock.callCount(), 1)
  })

  test('preflight options with no origin', async t => {
    req.method = 'OPTIONS'

    const ware = cors()
    await ware(req, res, next)

    assert.equal(res.code, 204)
    assert.deepEqual(res.headers, {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'Content-Type',
      'access-control-allow-private-network': true,
      vary: 'Origin, Accept-Encoding, Content-Type'
    })
    assert.equal(next.mock.callCount(), 0)
    assert.equal(res.end.mock.callCount(), 1)
  })

  test('CORS headers on reflected origin', async t => {
    req.method = 'POST'
    req.headers.origin = 'foo'

    const ware = cors()
    await ware(req, res, next)

    assert.deepEqual(res.headers, {
      'access-control-allow-origin': 'foo',
      'access-control-expose-headers': 'Content-Encoding'
    })
    assert.equal(next.mock.callCount(), 1)
    assert.equal(next.mock.calls[0].arguments.length, 0)
    assert.equal(res.end.mock.callCount(), 0)
  })

  test('CORS headers on no origin', async t => {
    req.method = 'POST'

    const ware = cors()
    await ware(req, res, next)

    assert.deepEqual(res.headers, {
      'access-control-allow-origin': '*',
      'access-control-expose-headers': 'Content-Encoding'
    })
    assert.equal(next.mock.callCount(), 1)
    assert.equal(next.mock.calls[0].arguments.length, 0)
    assert.equal(res.end.mock.callCount(), 0)
  })
})

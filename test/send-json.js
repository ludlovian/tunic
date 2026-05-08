import test from 'node:test'
import assert from 'node:assert/strict'
import zlib from 'node:zlib'

import { sendJson } from '@ludlovian/tunic'

test('sendJson', t => {
  let req
  let res
  let next
  t.beforeEach(t => {
    req = { method: '', headers: {} }
    res = {
      headers: {},
      setHeader (k, v) {
        this.headers[k.toLowerCase()] = v
        return this
      },
      end: t.mock.fn()
    }
    next = t.mock.fn()
  })
  const bigData = Array.from({ length: 200 }, _ => Math.random())

  test('.sendJson added', async t => {
    const ware = sendJson()
    await ware(req, res, next)
    assert.equal(next.mock.callCount(), 1)
    assert.equal(next.mock.calls[0].arguments.length, 0)
    assert.equal(typeof res.sendJson, 'function')
  })

  test('JSON with no encoding requested', async t => {
    const data = { foo: 'bar' }
    const exp = Buffer.from(JSON.stringify(data))

    const ware = sendJson()
    await ware(req, res, next)
    res.sendJson(data)

    assert.deepEqual(res.headers, {
      'content-type': 'application/json',
      vary: 'Accept-Encoding',
      'content-length': exp.length
    })
    assert.equal(res.end.mock.callCount(), 1)
    const act = res.end.mock.calls[0].arguments[0]
    assert.equal(Buffer.compare(act, exp), 0)
  })

  test('JSON too small to encode', async t => {
    const data = { foo: 'bar' }
    const exp = Buffer.from(JSON.stringify(data))

    const ware = sendJson()
    req.headers['accept-encoding'] = 'gzip, br'
    await ware(req, res, next)
    res.sendJson(data)

    assert.deepEqual(res.headers, {
      'content-type': 'application/json',
      vary: 'Accept-Encoding',
      'content-length': exp.length
    })
    assert.equal(res.end.mock.callCount(), 1)
    const act = res.end.mock.calls[0].arguments[0]
    assert.equal(Buffer.compare(act, exp), 0)
  })

  test('big JSON - gzipped', async t => {
    const exp = zlib.gzipSync(JSON.stringify(bigData))

    const ware = sendJson()
    req.headers['accept-encoding'] = 'gzip, br'
    await ware(req, res, next)
    res.sendJson(bigData)

    assert.deepEqual(res.headers, {
      'content-type': 'application/json',
      vary: 'Accept-Encoding',
      'content-length': exp.length,
      'content-encoding': 'gzip'
    })
    assert.equal(res.end.mock.callCount(), 1)
    const act = res.end.mock.calls[0].arguments[0]
    assert.equal(Buffer.compare(act, exp), 0)
  })

  test('big JSON - not gzipped', async t => {
    const exp = Buffer.from(JSON.stringify(bigData))

    const ware = sendJson()
    req.headers['accept-encoding'] = 'deflate, zip, br'
    await ware(req, res, next)
    res.sendJson(bigData)

    assert.deepEqual(res.headers, {
      'content-type': 'application/json',
      vary: 'Accept-Encoding',
      'content-length': exp.length
    })
    assert.equal(res.end.mock.callCount(), 1)
    const act = res.end.mock.calls[0].arguments[0]
    assert.equal(Buffer.compare(act, exp), 0)
  })

  test('big JSON - gzip fails', async t => {
    const exp = Buffer.from(JSON.stringify(bigData))
    const err = new Error('foo')
    t.mock.method(zlib, 'gzipSync', () => {
      throw err
    })
    t.mock.method(console, 'error', () => {})

    const ware = sendJson()
    req.headers['accept-encoding'] = 'gzip, br'
    await ware(req, res, next)
    res.sendJson(bigData)

    assert.deepEqual(res.headers, {
      'content-type': 'application/json',
      vary: 'Accept-Encoding',
      'content-length': exp.length
    })
    assert.equal(res.end.mock.callCount(), 1)
    const act = res.end.mock.calls[0].arguments[0]
    assert.equal(Buffer.compare(act, exp), 0)

    assert.equal(console.error.mock.callCount(), 1)
    assert.equal(console.error.mock.calls[0].arguments[0], err)
  })
})

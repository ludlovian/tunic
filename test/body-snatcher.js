import test from 'node:test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'

import { bodySnatcher } from '@ludlovian/tunic'

test('bodySnatcher', t => {
  test('standard text body', async t => {
    const req = Readable.from([
      Buffer.from('line 1\n'), //
      Buffer.from('line 2\n')
    ])

    req.method = 'POST'
    req.headers = { 'content-type': 'application/text' }

    const ware = bodySnatcher()
    const next = t.mock.fn()
    const res = {}
    await ware(req, res, next)

    assert.equal(req.body, 'line 1\nline 2\n')
    assert.equal(next.mock.callCount(), 1)
    assert.equal(next.mock.calls[0].arguments.length, 0)
  })

  test('standard json body with custom method', async t => {
    const exp = { foo: 'bar' }
    const req = Readable.from(
      Array.from(JSON.stringify(exp)).map(c => Buffer.from(c))
    )

    req.method = 'PATCH'
    req.headers = { 'content-type': 'application/json' }

    const ware = bodySnatcher({ method: ['PATCH', 'POST'] })
    const next = t.mock.fn()
    const res = {}
    await ware(req, res, next)

    assert.deepEqual(req.body, exp)
    assert.equal(next.mock.callCount(), 1)
    assert.equal(next.mock.calls[0].arguments.length, 0)
  })

  test('method that does not match', async t => {
    const req = Readable.from(['foo', 'bar'])
    req.method = 'GET'
    req.headers = { 'content-type': 'application/json' }

    const ware = bodySnatcher()
    const next = t.mock.fn()
    const res = {}
    await ware(req, res, next)

    assert.equal(req.body, undefined)
    assert.equal(req.readable, true)
    assert.equal(next.mock.callCount(), 1)
    assert.equal(next.mock.calls[0].arguments.length, 0)
  })

  test('Error in collection', async t => {
    const exp = { foo: 'bar' }
    const req = Readable.from(
      Array.from(JSON.stringify(exp))
        .slice(0, -1)
        .map(c => Buffer.from(c))
    )

    req.method = 'POST'
    req.headers = { 'content-type': 'application/json' }

    const ware = bodySnatcher()
    const next = t.mock.fn()
    t.mock.method(console, 'error', () => {})
    const res = {}
    await ware(req, res, next)

    assert(req.body == null)
    assert.equal(next.mock.callCount(), 1)
    const err = next.mock.calls[0].arguments[0]
    assert.equal(err instanceof SyntaxError, true)
    assert.match(err.message, /JSON/)
    assert.equal(console.error.mock.callCount(), 1)
    assert.equal(console.error.mock.calls[0].arguments[0], err)
  })
})

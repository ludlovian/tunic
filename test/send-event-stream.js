import test from 'node:test'
import assert from 'node:assert/strict'

import { sendEventStream } from '@ludlovian/tunic'

test('sendEventStream', t => {
  let req
  let res
  let next
  t.beforeEach(t => {
    req = {
      url: '/path',
      on (ev, fn) {
        this[`on${ev}`] = fn
      },
      destroy: t.mock.fn()
    }
    res = {
      out: '',
      code: undefined,
      headers: {},
      writeHead (c, h) {
        for (const k in h) {
          this.headers[k.toLowerCase()] = h[k]
        }
        return this
      },
      end: t.mock.fn(),
      write (s, enc, cb) {
        this.out += s
        if (cb) Promise.resolve().then(() => cb(null))
      }
    }
    next = t.mock.fn()
  })

  async function * generateStream (n, delay = 0) {
    for (let i = 1; i <= n; i++) {
      await new Promise(resolve => setTimeout(resolve, delay))
      yield `Line ${i}a\nLine ${i}b`
      yield ''
    }
  }

  test('.sendEventStream added', async t => {
    const ware = sendEventStream()
    await ware(req, res, next)
    assert.equal(next.mock.callCount(), 1)
    assert.equal(next.mock.calls[0].arguments.length, 0)
    assert.equal(typeof res.sendEventStream, 'function')
  })

  test('basic stream', async t => {
    const ware = sendEventStream()
    req.url = '/path?hb=0'
    await ware(req, res, next)
    const str = generateStream(2)
    const pDone = res.sendEventStream(str)

    assert.equal(typeof req.onclose, 'function')

    await pDone
    req.onclose()

    assert.deepEqual(
      res.out,
      [
        'data: Line 1a\n',
        'data: Line 1b\n',
        '\n',
        'data: Line 2a\n',
        'data: Line 2b\n',
        '\n'
      ].join('')
    )
    assert.equal(res.end.mock.callCount(), 1)
    assert.deepEqual(await str.next(), { value: undefined, done: true })
  })

  test('with heart beat', async t => {
    const ware = sendEventStream()
    req.url = '/path?hb=4'
    await ware(req, res, next)
    const str = generateStream(2, 6)
    const pDone = res.sendEventStream(str)

    assert.equal(typeof req.onclose, 'function')

    await pDone
    req.onclose()

    assert.deepEqual(
      res.out,
      [
        ':\n\n',
        'data: Line 1a\n',
        'data: Line 1b\n',
        '\n',
        ':\n\n',
        'data: Line 2a\n',
        'data: Line 2b\n',
        '\n'
      ].join('')
    )
    assert.equal(res.end.mock.callCount(), 1)
    assert.deepEqual(await str.next(), { value: undefined, done: true })
  })

  test('with named event', async t => {
    const ware = sendEventStream({ event: 'ev' })
    await ware(req, res, next)
    const str = generateStream(2)
    const pDone = res.sendEventStream(str)

    assert.equal(typeof req.onclose, 'function')

    await pDone
    req.onclose()

    assert.deepEqual(
      res.out,
      [
        'event: ev\n',
        'data: Line 1a\n',
        'data: Line 1b\n',
        '\n',
        'event: ev\n',
        'data: Line 2a\n',
        'data: Line 2b\n',
        '\n'
      ].join('')
    )
    assert.equal(res.end.mock.callCount(), 1)
    assert.deepEqual(await str.next(), { value: undefined, done: true })
  })

  test('with an error on write', async t => {
    const ware = sendEventStream()
    req.url = '/path?hb=XXX'
    const err = new Error('foo')
    res.write = t.mock.fn(
      (s, e, cb) => cb && Promise.resolve().then(() => cb(err))
    )

    await ware(req, res, next)
    const str = generateStream(2)
    const pDone = res.sendEventStream(str)

    await pDone

    assert.equal(res.end.mock.callCount(), 0)
    assert.equal(req.destroy.mock.callCount(), 1)
    assert.equal(req.destroy.mock.calls[0].arguments[0], err)
    assert.deepEqual(await str.next(), { value: undefined, done: true })
  })
})

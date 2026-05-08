import test from 'node:test'
import assert from 'node:assert/strict'

import { cashless } from '@ludlovian/tunic'

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

  test('no cache', async t => {
    const ware = cashless()
    await ware(req, res, next)

    const cc = res.headers['cache-control']
    assert(cc.includes('no-store'))
    assert(cc.includes('no-cache'))
    assert(cc.includes('must-revalidate'))
    assert(cc.includes('proxy-revalidate'))

    assert.equal(next.mock.callCount(), 1)
    assert.equal(next.mock.calls[0].arguments.length, 0)
  })
})

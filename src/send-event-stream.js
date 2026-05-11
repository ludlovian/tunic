import assert from 'node:assert'
import Timer from '@ludlovian/timer'

export function sendEventStream ({
  defaultHeartbeat = 30 * 1e3, //
  heartbeatName = 'hb',
  event
} = {}) {
  return (req, res, next) => {
    res.sendEventStream = async (source, { abort } = {}) => {
      assert(source?.[Symbol.toStringTag] === 'AsyncGenerator')

      res.writeHead(200, {
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Content-Type': 'text/event-stream'
      })

      const tmHeartbeat = new Timer()
      const hbPeriod = getHeartbeat(req, heartbeatName, defaultHeartbeat)
      if (hbPeriod) {
        tmHeartbeat.set({
          ms: hbPeriod,
          repeat: true,
          fn: () => res.write(':\n\n')
        })
      }

      req.on('close', () => {
        tmHeartbeat.cancel()
        abort ? abort() : source.return()
        res.end()
      })

      try {
        for await (const data of source) {
          if (!data) continue //
          const lines = data.split('\n').map(line => `data: ${line}\n`)
          if (event) lines.unshift(`event: ${event}\n`)
          tmHeartbeat.refresh()
          await new Promise((resolve, reject) =>
            res.write(lines.join('') + '\n', 'utf8', err =>
              err ? reject(err) : resolve()
            )
          )
        }
      } catch (err) {
        req.destroy(err)
        source.return()
      } finally {
        tmHeartbeat.cancel()
      }
    }
    next()
  }
}

function getHeartbeat (req, name, dflt) {
  const search = new URL('http://localhost' + req.url).searchParams
  if (!name || !search.has(name)) return dflt
  const ms = parseInt(search.get(name))
  return isNaN(ms) ? dflt : ms
}

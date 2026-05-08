import zlib from 'node:zlib'

export function sendJson () {
  return (req, res, next) => {
    res.sendJson = data => {
      let body = Buffer.from(JSON.stringify(data))
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Vary', 'Accept-Encoding')
      const accept = req.headers['accept-encoding'] || ''
      if (body.length > 1024 && accept.includes('gzip')) {
        try {
          body = zlib.gzipSync(body)
          res.setHeader('Content-Encoding', 'gzip')
        } catch (e) {
          console.error(e)
          // fallback to text
        }
      }
      res.setHeader('Content-Length', Buffer.byteLength(body))
      res.end(body)
    }
    next()
  }
}

export function cors () {
  return (req, res, next) => {
    if (req.method === 'OPTIONS') {
      res
        .writeHead(204, {
          'Access-Control-Allow-Origin': req.headers.origin || '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Private-Network': true,
          Vary: 'Origin, Accept-Encoding, Content-Type'
        })
        .end()
      return // all done
    }
    res
      .setHeader('Access-Control-Allow-Origin', req.headers.origin || '*')
      .setHeader('Access-Control-Expose-Headers', 'Content-Encoding')
    next()
  }
}

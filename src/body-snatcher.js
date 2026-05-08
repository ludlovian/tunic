export function bodySnatcher ({ method = 'POST' } = {}) {
  if (!Array.isArray(method)) method = [method]
  return async (req, res, next) => {
    try {
      if (!method.includes(req.method)) return next()

      req.setEncoding('utf8')
      let data = ''
      for await (const chunk of req) {
        data += chunk
      }
      if (req.headers['content-type'] === 'application/json') {
        if (data) data = JSON.parse(data)
      }
      req.body = data
      return next()
    } catch (err) {
      console.error(err)
      return next(err)
    }
  }
}

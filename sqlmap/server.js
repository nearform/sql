const Hapi = require('@hapi/hapi')
const server = Hapi.Server({ port: 8080 })
const users = require('./users')

server.register([users])
  .then(() => server.start())
  .then(
    () => logMessage('Server started on: http://localhost:8080'),
    (err) => logMessage(`Failed to start server: ${err.message}`)
  )

// if forked as child, send output message via ipc to parent
// otherwise output to console
function logMessage (message) {
  if (!process.send) {
    console.log(message)
  } else {
    process.send(message)
  }
}

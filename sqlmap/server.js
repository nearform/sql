const Hapi = require('hapi')
const server = new Hapi.Server()

server.connection({
  port: 8080,
  host: 'localhost'
})

server.register([
  {
    register: require('./users')
  }
])

server.start((err) => {
  if (err) {
    return logMessage(`Failed to start server: ${err.message}`)
  }
  logMessage('Server started on: http://localhost:8080')
})

// if forked as child, send output message via ipc to parent
// otherwise output to console
function logMessage (message) {
  if (!process.send) {
    console.log(message)
  } else {
    process.send(message)
  }
}

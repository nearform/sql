const jsonfile = require('jsonfile')
const spawn = require('child_process').spawn
const exec = require('child_process').exec
const path = require('path')
const source = path.join(__dirname, 'injection-endpoints.json')
const async = require('async')
const chalk = require('chalk')

const endpoints = jsonfile.readFileSync(source, { throws: false })

if (!endpoints) {
  console.error('⚠️ Invalid JSON file.')
  process.exit(1)
}

function findPython2 (pythonCommand, done) {
  return exec(`${pythonCommand} --version`, function (err, stdout, stderr) {
    if (err) {
      return done(err)
    }

    if (stderr.indexOf('Python 2.') >= 0) {
      console.log(chalk.green(`✅  '${pythonCommand}' is a valid Python2`))
      return done(null, pythonCommand)
    }
    return done(null, false)
  })
}

const sqlmapChalk = chalk.blue('sqlmap')

function executeMap (command, config, urlDescription, done) {
  console.log('⏳  Python command that will be used:', command)

  const params = [
    `./node_modules/sqlmap/sqlmap.py`,
    `--url=${urlDescription.url}`,
    `--method=${urlDescription.method}`,
    `--level=${config.level}`,
    `--risk=${config.risk}`,
    `--dbms=${config.dbms}`,
    `--timeout=${config.timeout}`,
    `-v`, `${config.verbose}`,
    `--flush-session`,
    `--batch`
  ]

  if (urlDescription.headers) {
    params.push(`--headers=${urlDescription.headers}`)
  }

  if (urlDescription.params) {
    params.push(`-p`)
    params.push(`${urlDescription.params}`)
  }
  if (urlDescription.data) {
    params.push(`--data=${urlDescription.data}`)
  }

  console.log(chalk.green('⏳  executing sqlmap with: ', (['' + command].concat(params)).join(' ')))

  const sql = spawn(command, params)
  let vulnerabilities = false

  sql.stdout.on('data', (data) => {
    if (data.length > 1) {
      console.log(`${sqlmapChalk} ${data}`)
    }
    if (data.indexOf('identified the following injection') >= 0) {
      vulnerabilities = true
    }
  })

  sql.stderr.on('data', (data) => {
    done(data)
  })

  sql.on('error', (error) => {
    console.log(`${sqlmapChalk} ${chalk.red(`⚠️  ${error}`)}`)
    done(new Error('failed to start child process'))
  })

  sql.on('close', (code) => {
    if (code !== 0) {
      console.log(`${sqlmapChalk} ${chalk.red(`⚠️  exited with code ${code}`)}`)
      return process.exit(1)
    }
    done(null, vulnerabilities)
  })
}

const hapiChalk = chalk.yellow('hapi')

const hapi = spawn('node', ['sqlmap/server.js'])

hapi.on('close', (code) => {
  if (code === 0) return
  console.log(`\n${hapiChalk} ${chalk.red(`⚠️  server exited with code ${code}`)}`)
  process.exit(1)
})

hapi.stdout.on('data', (data) => {
  console.log(`${hapiChalk} ${data}`)
})

hapi.stderr.on('data', (data) => {
  console.log(`${hapiChalk} ${chalk.red(data)}`)
})

async.detect(['python2', 'python'], findPython2, function (err, python) {
  if (err) {
    return console.error(chalk.red(err))
  }

  hapi.stdout.once('data', (data) => {
    async.everySeries(endpoints.urls, (urlDescription, done) => {
      executeMap(python, endpoints, urlDescription, (err, vulnerabilities) => {
        if (err) {
          console.error(chalk.red(err))
          return done(err, false)
        }

        done(null, !vulnerabilities)
      })
    }, (err, result) => {
      if (err) {
        console.error(chalk.red(err))
        return process.exit(1)
      }

      console.log('\n\n')
      hapi.kill()
      if (result) {
        console.log(`\n${sqlmapChalk} ${chalk.green('✅  no injection vulnerabilities found\n\n')}`)
        console.log()
        return process.exit(0)
      } else {
        console.log(`\n${sqlmapChalk} ${chalk.red('⚠️  FOUND injection vulnerabilities\n\n')}`)
        return process.exit(1)
      }
    })
  })
})

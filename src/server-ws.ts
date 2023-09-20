import { Chain } from 'smoldot'
import { WebSocketServer } from 'ws'
import { info, error } from './logger.ts'
import chalk from 'chalk'

const port = Number(process.env.PORT) || 9944

const runWsServer = (chain: Chain) => {
  const server = new WebSocketServer({
    port,
  })
  info(chalk.greenBright('JSON-RPC server now listening on port :9944'))
  server.on('connection', (connection, request) => {
    info('New JSON-RPC client connected: ' + request.socket.remoteAddress + '.')
    // Receiving a message from the connection. This is a JSON-RPC request.
    connection.on('message', function (data, isBinary) {
      if (!isBinary) {
        try {
          chain.sendJsonRpc(data.toString('utf8'))
        } catch (rpcErr) {
          const { message } = rpcErr as any
          connection.send(message)
        }
      } else {
        // TODO: Respond error instead of closing connection
        connection.close(1002) // Protocol error
      }
    })

    // When the connection closes, remove the chains that have been added.
    connection.on('close', function (reasonCode, description) {
      info('(JSON-RPC client ' + request.socket.remoteAddress + ' disconnected.')
      // TODO: What else
    })

    // Main loop
    // Maybe not while loop?
    ;(async () => {
      try {
        while (true) {
          const response = await chain.nextJsonRpcResponse()
          connection.send(response)
        }
      } catch (_error) {
        // RPC response error
      }
    })()
  })
}

export { runWsServer }

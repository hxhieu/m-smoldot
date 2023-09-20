import { Chain } from 'smoldot'
import { WebSocketServer } from 'ws'
import { info, error } from './logger.ts'
import chalk from 'chalk'
import { createServer } from 'http'

const port = Number(process.env.PORT) || 9944

const runWsServer = (chain: Chain) => {
  // HTTP server
  const server = createServer()
  // WS server
  const ws = new WebSocketServer({
    noServer: true,
  })

  ws.on('connection', (connection, request) => {
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

  // WS upgrade, on same HTTP port
  server.on('upgrade', (request, socket, head) => {
    ws.handleUpgrade(request, socket, head, (s) => {
      ws.emit('connection', s, request)
    })
  })

  // HTTP RPC
  server.on('request', (req, res) => {
    try {
      chain.sendJsonRpc(
        JSON.stringify({
          jsonrpc: '2.0',
          method: 'rpc_methods',
          id: '1',
        })
      )

      // Main loop
      // Maybe not while loop?
      ;(async () => {
        try {
          while (true) {
            const response = await chain.nextJsonRpcResponse()
            res.writeHead(400)
            res.end(response)
            break
          }
        } catch (_error) {
          // RPC response error
        }
      })()
    } catch (rpcErr) {
      const { message } = rpcErr as any
      res.writeHead(400)
      res.end(message)
    }
  })

  info(chalk.greenBright('JSON-RPC server now listening on port :9944'))
  server.listen(port)
}

export { runWsServer }

import { existsSync, readFileSync } from 'fs'
import chalk from 'chalk'
import { AddChainOptions, Chain, start } from 'smoldot'
import { OptionValues } from 'commander'

async function build(args: OptionValues) {
  // A single client can be used to initialize multiple chains.
  const client = start({
    // portToWorker: port1,
    maxLogLevel: 3, // Can be increased for more verbosity
    forbidTcp: false,
    forbidWs: false,
    forbidNonLocalWs: false,
    forbidWss: false,
    cpuRateLimit: 0.5,
    logCallback: (_level, target, message) => {
      // As incredible as it seems, there is currently no better way to print the current time
      // formatted in a certain way.
      const now = new Date()
      const hours = ('0' + now.getHours()).slice(-2)
      const minutes = ('0' + now.getMinutes()).slice(-2)
      const seconds = ('0' + now.getSeconds()).slice(-2)
      const milliseconds = ('00' + now.getMilliseconds()).slice(-3)
      console.log(
        `${chalk.grey('[%s:%s:%s.%s]')} ${chalk.magenta('[%s]')} %s`,
        hours,
        minutes,
        seconds,
        milliseconds,
        target,
        message
      )
    },
  })

  const { chain: spec, relay: relaySpec } = args

  if (!existsSync(spec)) {
    console.error(`Supplied chain spec ${chalk.cyanBright(spec)} not found.`)
    process.exit(1)
  }
  // Load a string chain specification.
  const chainSpec = readFileSync(spec, 'utf8')

  const addChainOpts: AddChainOptions = {
    chainSpec,
  }

  // Has a relay
  let relay
  if (existsSync(relaySpec)) {
    relay = await client.addChain({ chainSpec: readFileSync(relaySpec, 'utf8') })
    addChainOpts.potentialRelayChains = [relay]
  }

  const chain = await client.addChain(addChainOpts)

  // chain.sendJsonRpc('{"jsonrpc":"2.0","id":1,"method":"system_name","params":[]}')

  // Wait for a JSON-RPC response to come back. This is typically done in a loop in the background.
  // const jsonRpcResponse = await chain.nextJsonRpcResponse()
  // console.log(jsonRpcResponse)

  return { chain, relay: relay as Chain }
}

export { build }

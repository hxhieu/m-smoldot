import { program } from 'commander'
import { existsSync, readFileSync } from 'fs'
import chalk from 'chalk'
import { start } from 'smoldot'

program //
  .option('--chain <value>', 'Path to chain spec file')
  .option('--relay <value>', 'Path to the relay chain spec file, for parachain')
  .parse()

const { chain: spec, relay: relaySpec } = program.opts()

if (!existsSync(spec)) {
  console.error(`Supplied chain spec ${chalk.cyanBright(spec)} not found.`)
  process.exit(1)
}

async function run() {
  // Load a string chain specification.
  const chainSpec = readFileSync(spec, 'utf8')

  // A single client can be used to initialize multiple chains.
  const client = start()

  const chain = await client.addChain({ chainSpec })

  if (existsSync(relaySpec)) {
    const relay = await client.addChain({ chainSpec: readFileSync(relaySpec, 'utf8') })
  }

  chain.sendJsonRpc('{"jsonrpc":"2.0","id":1,"method":"system_name","params":[]}')

  // Wait for a JSON-RPC response to come back. This is typically done in a loop in the background.
  // const jsonRpcResponse = await chain.nextJsonRpcResponse()
  // console.log(jsonRpcResponse)
}

run()

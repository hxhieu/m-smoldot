import { program } from 'commander'
import { buildChainNode } from './chain-node.ts'
import { runWsServer } from './server-ws.ts'

program //
  .option('--chain <value>', 'Path to chain spec file')
  .option('--relay <value>', 'Path to the relay chain spec file, this is needed for parachain')
  .parse()

const args = program.opts()

async function run() {
  const { chain } = await buildChainNode(args)
  runWsServer(chain)
}

run()

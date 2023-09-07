import { program } from 'commander'
import { existsSync, readFileSync } from 'fs'
import chalk from 'chalk'
import { start } from 'smoldot'
import { build } from './chain-node.ts'

program //
  .option('--chain <value>', 'Path to chain spec file')
  .option('--relay <value>', 'Path to the relay chain spec file, for parachain')
  .parse()

const args = program.opts()

async function run() {
  const { chain, relay } = await build(args)
}

run()

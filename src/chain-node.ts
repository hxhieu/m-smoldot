import { existsSync, readFileSync } from 'fs'
import chalk from 'chalk'
import { Chain, start } from 'smoldot'
import { OptionValues } from 'commander'
import { info, error } from './logger.ts'
import { ChainNodeChain } from './types.ts'

const buildChainNode = async (args: OptionValues): Promise<ChainNodeChain> => {
  const { chain: chainSpecFile, relay: relaySpecFile } = args

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
      info(
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

  if (!existsSync(chainSpecFile)) {
    error(`Supplied chain spec ${chalk.cyanBright(chainSpecFile)} not found.`)
    process.exit(1)
  }
  // Load a string chain specification.
  const chainSpec = readFileSync(chainSpecFile, 'utf8')

  // Has a relay
  let relaySpec: string = ''
  if (existsSync(relaySpecFile)) {
    relaySpec = readFileSync(relaySpecFile, 'utf8')
  }

  let chain: Chain
  let relay: Chain

  // Start the chains
  if (relaySpec) {
    relay = await client.addChain({
      chainSpec: relaySpec,
    })
    chain = await client.addChain({
      chainSpec,
      potentialRelayChains: [relay],
    })
    return { chain, relay }
  } else {
    chain = await client.addChain({
      chainSpec,
    })
    return { chain }
  }
}

export { buildChainNode }

import 'bluebird-global'
// eslint-disable-next-line import/order
import '../../sdk/rewire'

import chalk from 'chalk'
import { BotpressApp, createApp } from 'core/app/loader'
import { LoggerProvider, LogLevel } from 'core/logger'
import fs from 'fs'
import _ from 'lodash'
import { showBanner } from './banner'

async function getLogger(provider: LoggerProvider, loggerName: string) {
  const logger = await provider(loggerName)

  global.printErrorDefault = err => {
    logger.attachError(err).error('Unhandled Rejection')
  }

  return logger
}

async function setupDebugLogger(provider: LoggerProvider) {
  const logger = await provider('')

  global.printBotLog = (botId, args) => {
    const message = args[0]
    const rest = args.slice(1)

    logger
      .level(LogLevel.DEBUG)
      .persist(false)
      .forBot(botId)
      .debug(message.trim(), rest)
  }

  global.printLog = args => {
    const message = args[0]
    const rest = args.slice(1)

    logger
      .level(LogLevel.DEBUG)
      .persist(false)
      .debug(message.trim(), rest)
  }
}

async function start() {
  const app = createApp()
  await setupDebugLogger(app.logger)
  await app.database.initialize()

  const logger = await getLogger(app.logger, 'Launcher')

  showBanner({ title: 'Botpress Studio', version: process.STUDIO_VERSION, logScopeLength: 9, bannerWidth: 75, logger })

  if (!fs.existsSync(process.APP_DATA_PATH)) {
    try {
      fs.mkdirSync(process.APP_DATA_PATH)
    } catch (err) {
      logger.attachError(err).error(
        `Could not find/create APP_DATA folder "${process.APP_DATA_PATH}".
Please make sure that Botpress has the right to access this folder or change the folder path by providing the 'APP_DATA_PATH' env variable.
This is a fatal error, process will exit.`
      )

      if (!process.IS_FAILSAFE) {
        process.exit(1)
      }
    }
  }

  await app.botpress.start().catch(err => {
    logger.attachError(err).error('Error starting Botpress Studio')

    if (!process.IS_FAILSAFE) {
      process.exit(1)
    }
  })

  logger.info(chalk.gray(`Studio is listening at: ${process.LOCAL_URL}`))
}

start().catch(global.printErrorDefault)

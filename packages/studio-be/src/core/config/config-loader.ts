import { BotConfig, Logger } from 'botpress/sdk'
import { ObjectCache } from 'common/object-cache'
import { GhostService } from 'core/bpfs'
import { stringify } from 'core/misc/utils'
import { TYPES } from 'core/types'
import { FatalError } from 'errors'
import fse from 'fs-extra'
import { inject, injectable } from 'inversify'
import defaultJsonBuilder from 'json-schema-defaults'
import _, { PartialDeep } from 'lodash'
import path from 'path'

import { StudioConfig } from './studio.config'

@injectable()
export class ConfigProvider {
  private _studioConfigCache: StudioConfig | undefined
  public initialConfigHash: string | undefined
  public currentConfigHash!: string

  constructor(
    @inject(TYPES.GhostService) private ghostService: GhostService,
    @inject(TYPES.Logger) private logger: Logger,
    @inject(TYPES.ObjectCache) private cache: ObjectCache
  ) {}

  public async createDefaultConfigIfMissing() {
    const fileLocation = path.join(process.TEMP_LOCATION, 'studio.config.json')

    if (!(await fse.pathExists(fileLocation))) {
      const botpressConfigSchema = await fse.readJSON(path.join(__dirname, 'schemas', 'studio.config.schema.json'))
      const defaultConfig: StudioConfig = defaultJsonBuilder(botpressConfigSchema)

      const config = {
        $schema: '../studio.config.schema.json',
        ...defaultConfig,
        version: process.STUDIO_VERSION
      }

      await fse.writeJson(fileLocation, config, { spaces: 2 })
    }
  }

  async getBotpressConfig(): Promise<StudioConfig> {
    if (this._studioConfigCache) {
      return this._studioConfigCache
    }

    await this.createDefaultConfigIfMissing()

    const config = await this.getConfig<StudioConfig>('studio.config.json')

    const envPort = process.env.BP_PORT || process.env.PORT
    config.httpServer.port = envPort ? parseInt(envPort) : config.httpServer.port
    config.httpServer.host = process.env.BP_HOST || config.httpServer.host

    this._studioConfigCache = config

    return config
  }

  async getBotConfig(botId: string): Promise<BotConfig> {
    return this.getConfig<BotConfig>('bot.config.json', botId)
  }

  async setBotConfig(botId: string, config: BotConfig, ignoreLock?: boolean) {
    await this.ghostService.forBot(botId).upsertFile('/', 'bot.config.json', stringify(config), { ignoreLock })
  }

  async mergeBotConfig(botId: string, partialConfig: PartialDeep<BotConfig>, ignoreLock?: boolean): Promise<BotConfig> {
    const originalConfig = await this.getBotConfig(botId)
    const config = _.merge(originalConfig, partialConfig)
    await this.setBotConfig(botId, config, ignoreLock)
    return config
  }

  private async getConfig<T>(fileName: string, botId?: string): Promise<T> {
    try {
      let content: string

      if (botId) {
        content = await this.ghostService
          .forBot(botId)
          .readFileAsString('/', fileName)
          .catch(_err => this.ghostService.forBot(botId).readFileAsString('/', fileName))
      } else {
        content = (await fse.readFile(path.resolve(process.TEMP_LOCATION, fileName))).toString()
      }

      if (!content) {
        throw new FatalError(`Modules configuration file "${fileName}" not found`)
      }

      // Variables substitution
      // TODO Check of a better way to handle path correction
      content = content.replace('%BOTPRESS_DIR%', process.PROJECT_LOCATION.replace(/\\/g, '/'))

      return <T>JSON.parse(content)
    } catch (e) {
      throw new FatalError(e, `Error reading configuration file "${fileName}"`)
    }
  }

  public async getBrandingConfig(appName: 'admin' | 'studio') {
    const config = await this.getBotpressConfig()
    const { title, favicon, customCss } = config.pro?.branding?.[appName] ?? {}

    return {
      title: title || '',
      favicon: favicon || '',
      customCss: customCss || ''
    }
  }
}

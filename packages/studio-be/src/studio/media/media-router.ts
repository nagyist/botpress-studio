import { StudioConfig } from 'core/config'
import { fileUploadMulter } from 'core/routers'
import _ from 'lodash'
import ms from 'ms'
import path from 'path'
import { StudioServices } from 'studio/studio-router'
import { CustomStudioRouter } from 'studio/utils/custom-studio-router'

const debugMedia = DEBUG('audit:action:media-upload')

const DEFAULT_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'audio/mpeg', 'video/mp4']
const DEFAULT_MAX_FILE_SIZE = '25mb'
const ONE_YEAR_SEC = ms('1y') / 1000

class MediaRouter extends CustomStudioRouter {
  constructor(services: StudioServices) {
    super('User', services)
  }

  async setupRoutes(studioConfig: StudioConfig) {
    const router = this.router

    this.router.get(
      '/:filename',
      this.asyncMiddleware(async (req, res) => {
        const { filename } = req.params

        const type = path.extname(filename)
        const buff = await this.mediaServiceProvider
          .forBot(process.BOT_ID)
          .readFile(filename)
          .catch(() => undefined)

        if (!buff) {
          return res.sendStatus(404)
        }

        // files are never overwritten because of the unique ID
        // so we can set the header to cache the asset for 1 year
        return res
          .set({ 'Cache-Control': `max-age=${ONE_YEAR_SEC}` })
          .type(type)
          .send(buff)
      })
    )

    const mediaUploadMulter = fileUploadMulter(
      studioConfig.fileUpload.allowedMimeTypes ?? DEFAULT_ALLOWED_MIME_TYPES,
      studioConfig.fileUpload.maxFileSize ?? DEFAULT_MAX_FILE_SIZE
    )

    router.post(
      '/',
      this.asyncMiddleware(async (req, res) => {
        mediaUploadMulter(req, res, async err => {
          if (err) {
            return res.status(400).send(err.message)
          }

          const botId = req.params.botId
          const mediaService = this.mediaServiceProvider.forBot(botId)
          const file = req['file']
          const { url, fileName } = await mediaService.saveFile(file.originalname, file.buffer)

          debugMedia(`success. file: ${fileName} %o`, _.pick(file, 'originalname', 'mimetype', 'size'))

          res.json({ url })
        })
      })
    )

    router.post(
      '/delete',
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId
        const files = this.cmsService.getMediaFiles(req.body)
        const mediaService = this.mediaServiceProvider.forBot(botId)

        await Promise.map(files, async f => {
          await mediaService.deleteFile(f)
          debugMedia(`successful deletion file: ${f}`)
        })

        res.sendStatus(200)
      })
    )
  }
}

export default MediaRouter

import { endent } from '@dword-design/functions'
import puppeteer from '@dword-design/puppeteer'
import { execa } from 'execa'
import fs from 'fs-extra'
import { createRequire } from 'module'
import P from 'path'
import kill from 'tree-kill-promise'
import waitPort from 'wait-port'
import withLocalTmpDir from 'with-local-tmp-dir'

const _require = createRequire(import.meta.url)

const self = _require.resolve('./cli.js')

export default {
  async afterEach() {
    await this.page.close()
    await this.browser.close()
    this.resetWithLocalTmpDir()
  },
  before: () => execa(self, ['install'], { stdio: 'inherit' }),
  async beforeEach() {
    this.resetWithLocalTmpDir = await withLocalTmpDir()
    this.browser = await puppeteer.launch()
    this.page = await this.browser.newPage()
  },
  async 'nuxt 2 build'() {
    await fs.outputFile(
      P.join('pages', 'index.vue'),
      endent`
        <template>
          <div :class="foo" />
        </template>

        <script>
        export default {
          asyncData: () => ({ foo: 'bar' }),
        }
        </script>
      `,
    )
    await execa(self, ['--nuxt-version', '2', 'build'])

    const childProcess = execa(self, ['--nuxt-version', '2', 'start'])
    await waitPort({ port: 3000 })
    await this.page.goto('http://localhost:3000')
    await this.page.waitForSelector('.bar')
    await kill(childProcess.pid)
  },
  'nuxt 2 version': async () =>
    expect((await execa(self, ['--nuxt-version', '2', '-v'])).stdout).toMatch(
      '@nuxt/cli v2',
    ),
  async 'nuxt 3 build'() {
    await fs.outputFile(
      P.join('pages', 'index.vue'),
      endent`
        <template>
          <div :class="foo" />
        </template>

        <script setup>
        const foo = 'bar'
        </script>
      `,
    )
    await execa(self, ['build'])

    const childProcess = execa(self, ['start'])
    await waitPort({ port: 3000 })
    await this.page.goto('http://localhost:3000')
    await this.page.waitForSelector('.bar')
    await kill(childProcess.pid)
  },
  'nuxt 3 version': async () =>
    expect((await execa(self, ['-v'])).stdout).toMatch('Nuxi 3'),
}

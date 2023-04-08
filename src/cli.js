#!/usr/bin/env node

import packageName from 'depcheck-package-name'
import { execa, execaCommand } from 'execa'
import { findUp } from 'find-up'
import fs from 'fs-extra'
import makeCli from 'make-cli'
import parsePackagejsonName from 'parse-packagejson-name'
import P from 'path'

const packageConfig = fs.readJsonSync(
  new URL('../package.json', import.meta.url),
)

const selfName = parsePackagejsonName(packageConfig.selfName).fullName

const getNuxt = version =>
  version === 2
    ? findUp(
        P.join(
          'node_modules',
          '.cache',
          selfName,
          'node_modules',
          '.bin',
          'nuxt',
        ),
      )
    : packageName`nuxt`

const run = async () => {
  try {
    await makeCli({
      action: async (command, options) => {
        options = { ...options, nuxtVersion: parseInt(options.nuxtVersion, 10) }

        const nuxt = await getNuxt(options.nuxtVersion)
        await execa(nuxt, command ? [command] : [], { stdio: 'inherit' })
      },
      allowUnknownOption: true,
      arguments: '[command]',
      commands: [
        {
          handler: async () => {
            await fs.outputFile(
              P.join('node_modules', '.cache', selfName, 'package.json'),
              JSON.stringify({}),
            )
            await execaCommand('yarn add nuxt@^2', {
              cwd: P.join('node_modules', '.cache', selfName),
              stdio: 'inherit',
            })
          },
          name: 'install',
        },
      ],
      options: [
        {
          name: '--nuxt-version <version>',
        },
      ],
    })
  } catch (error) {
    console.log(error.message)
    process.exit(1)
  }
}
run()

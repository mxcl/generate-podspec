const core = require('@actions/core')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const https = require("https")
const { Toolkit } = require('actions-toolkit')
const semver = require('semver')
const fs = require('fs')

Toolkit.run(async tools => {
  const pkg = await parsePackageDotSwift()
  const repo = await getRepoMetadata()
  const user = tools.inputs['author']
  const email = tools.inputs['author-email']
  const slug = repo.full_name
  const swiftVersions = tools.inputs['swift-versions']
  const osx_deployment_target = tools.inputs['macOS-deployment-target']
  const ios_deployment_target = tools.inputs['iOS-deployment-target']
  const tvos_deployment_target = tools.inputs['tvOS-deployment-target']
  const watchos_deployment_target = tools.inputs['watchOS-deployment-target']
  const sources = 'Sources'
  const tag = tools.context.payload.tag_name
  
  let out = `
  Pod::Spec.new do |s|
    s.name = '${pkg.name}'
    s.author = { '${user}: ${email} }
    s.source = { git: "https://github.com/${slug}.git", tag: '${tag}' }
    s.version = '${version()}'
    s.summary = '${repo.description}'
    s.license = '${repo.license.spdx_id}'
    s.homepage = "https://github.com/${slug}"
  `
  if (osx_deployment_target) out += `    s.osx.deployment_target = '${osx_deployment_target}'\n`
  if (osx_deployment_target) out += `    s.ios.deployment_target = '${ios_deployment_target}'\n`
  if (osx_deployment_target) out += `    s.tvos.deployment_target = '${tvos_deployment_target}'\n`
  if (osx_deployment_target) out += `    s.watchos.deployment_target = '${watchos_deployment_target}'\n`
  out += `
    s.source_files = '${sources}/**/*.swift'
    s.swift_versions = [${swiftVersions}]
    s.module_name = '${moduleName()}'
  end
  `
  tools.outputs.name = `${pkg.name}.podspec`
  fs.writeFileSync(tools.outputs.name, out)

  function moduleName() {
    for (const product of pkg.products) {
      if (product.type.library === 'automatic') return product.name
    }
    throw new Error("Could not determine `module_name` from the package manifest")
  }
  function version() {
    const v = semver.valid(tools.context.payload.name) || 
      semver.value(tools.context.payload.tag)
    if (!v) throw new Error("Could not determine `version` from the release payload")
  }
  async function getRepoMetadata(): Promise<Repo> {
    return await tools.repos.repository(slug)
  }
})

interface Package {
  name: string
  swiftLanguageVersions: string[]
  targets: Target[]
  products : Product[]
}

interface Product {
  name: string
  type: {library: 'automatic'} 
}

interface Target {
  path?: string
  type: 'regular' | 'test'
  name: string
}

async function parsePackageDotSwift(): Promise<Package> {
  const {stdout, stderr} = await exec("swift package dump-package")
  if (stderr) console.error(stderr)
  return JSON.parse(stdout)
}

interface Repo {
  description: string
  license: { spdx_id: string }
  full_name: string
}

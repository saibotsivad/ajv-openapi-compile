# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

Change categories are:

* `Added` for new features.
* `Changed` for changes in existing functionality.
* `Deprecated` for once-stable features removed in upcoming releases.
* `Removed` for deprecated features removed in this release.
* `Fixed` for any bug fixes.
* `Security` to invite users to upgrade in case of vulnerabilities.

## [Unreleased]
### Added
### Changed
### Deprecated
### Fixed
### Removed
### Security

## [0.0.5-0.0.6] - 2021-11-10
### Added
- Support for importing from an OpenAPI YAML file.
### Changed
- BREAKING CHANGE: Figured out how to use Rollup to output an ES file, so you'll need to re-read that if you're not using the CLI version. Also changed the exports so there's `{ schemas, getId, getSchema }` instead.
- BREAKING CHANGE: Instead of trying to figure out a way to normalize the weird request/response body stuff, there's a schema tree maintained internally, which is used to look up the `$ref` path entirely. This means you just use the full path like you would, and ignore that there are `$ref` elements along the way.

## [0.0.3-0.0.4] - 2021-11-08
### Fixed
- Bump version of `ajv` to try getting rid of a weird bug.

## [0.0.2] - 2021-10-19
### Fixed
- Documentation for the CLI command.

## [0.0.1] - 2021-10-19
### Added
- Basic functionality: a module and CLI tool.

## [0.0.0] - 2021-10-19
### Added
- Created the base project.

[Unreleased]: https://github.com/saibotsivad/ajv-openapi-compile/compare/v0.0.0...HEAD
[0.0.5-0.0.6]: https://github.com/saibotsivad/ajv-openapi-compile/compare/v0.0.4...v0.0.6
[0.0.3-0.0.4]: https://github.com/saibotsivad/ajv-openapi-compile/compare/v0.0.2...v0.0.4
[0.0.2]: https://github.com/saibotsivad/ajv-openapi-compile/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/saibotsivad/ajv-openapi-compile/compare/v0.0.0...v0.0.1

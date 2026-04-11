<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo_text.svg" width="320" alt="Nest Logo" /></a>
</p>

## Commit Message Guidelines

https://www.conventionalcommits.org/en/v1.0.0/

https://github.com/angular/angular/blob/22b96b9/CONTRIBUTING.md#-commit-message-guidelines

## Installation

```bash
$ npm install
```

## Prepare

set up `.env.development`, `.env.production`, `.env.test` files in `env` folder like `.env.example`

## Create & run docker's containers

```bash
$ docker-compose up --build -d
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Documentation

```bash
# serve doc page
$ npm run doc

# generate doc files
$ npm run doc:generate
```

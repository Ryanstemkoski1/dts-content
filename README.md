# API - Content service

Server for user-generated content management.

## Workflow

`master` and `staging` branches automatically get built on the CI server and the result is deployed to `dts-api-content` application on ElasticBeanstalk.

## Prerequisites

* Node.js 12
* MongoDB
* AWS SDK

## First time setup

* Provide a `GITHUB_TOKEN` environment variable to access the private npm repository.
* Run `npm i`.
* Create an `.env` file to provide information about your local MongoDB server and `NODE_ENV`.

## Scripts

* `npm run dev` - launch a development environment.
* `npm run lint` - run a linter.
* `npm run test` - run test suites. Provide an environment variable `TEST` to include only selected test files, e.g. `TEST=theme npm run test`.
* `npm run swagger` - generate a Swagger specification file.
* `npm run docker` - run the application in a Docker container. Requires `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` environment variables.

## Lambda Packager

Lambda Packager builds your project's npm packages for use on AWS
Lambda using AWS Lambda.

### Motivation

AWS Lambda runs Node.js apps, but you have to provide the `node_modules`
directory yourself. Compiling on your local machine won't work if your
dependencies contain native code that needs to be compiled.

Lambda Packager makes deploying Node.js code to AWS Lambda easy, by
using Lambda to compile your dependencies. Point it at the directory
containing your Node.js Lambda function (it must contains a
`package.json` file with a list of dependencies), and it will build a
zip file of that directory with a `node_modules` directory built using
Lambda, ready to deploy.

### Usage

**Warning**: Out of the box, Lambda Packager uploads your project's
`package.json` file to a third-party server to build dependencies. If
you'd rather host your own dependency builder, see the
[Deployment](#deployment) section.

#### Command Line

```sh
lambda-packager package my-package output.zip
```

#### Programmatic

```js
var lambdaPackager = require('lambda-packager');

lambdaPackager.build({
  from: 'my-package',
  to: 'output.zip'
});
```

Assuming `my-package` is a path to a directory with a `package.json`
file, its dependencies will be compiled via Lambda, then the package
plus the dependencies will be placed into `my-package-function.zip`.

## How It Works

npm packages written in pure JavaScript run fine on Lambda, but many
packages contain native code (written in C or C++) that must be
compiled. If you build those dependencies on your local machine, they're
unlikely to work on the custom version of Amazon Linux that powers AWS
Lambda.

Lambda Packer works by invoking a Lambda function running on AWS and
uploading your project's `package.json` to it. It copies that
`package.json` to a temp directory, runs `npm install` to install the
dependencies in the Lambda environments, uploads those dependencies to
S3, then downloads them back to your local machine.

To facilitate deployment, Lambda Packager will create a copy of your Node
package, copy in the Lambda-built `node_modules` directory, and zip it
all up so you can deploy it via the AWS console or CLI utility.

## Deployment

To build dependencies, Lambda Packager uploads your `package.json` to a
Lambda function that builds your dependencies in the AWS environment. By
default, it will use a Lambda function generously hosted and paid for by
[Bustle Labs][bustle-labs].

If you would prefer to deploy your own Lambda function for building
dependencies, run the `lambda-packager deploy` command.

This command builds a CloudFormation stack that provisions
everything needed to build dependencies for Lambda Packager:

* IAM Role
* Lambda Function
* S3 Bucket

Make sure that the AWS account you have authorized via the AWS CLI has
permission to create each of these resources. The `lambda-packager
deploy` command uses the same credentials as the AWS CLI command. You
can specify a profile for deploying providing the `--profile` option:

```sh
lambda-packager deploy --profile admin
```

## Thanks

Lambda Packager was inspired by the [Thaumaturgy][thaumaturgy] project.
I wanted to make something more automated that used my projects'
`package.json` rather than specifying dependencies manually. I also
wanted something that bundled everything up into a ready-to-deploy zip.

Work on this project is generously sponsored by [Bustle Labs][bustle-labs].

[thaumaturgy]: https://github.com/node-hocus-pocus/thaumaturgy
[bustle-labs]: http://www.bustle.com/labs

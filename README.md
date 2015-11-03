## Lambda Packager

AWS Lambda runs Node.js apps, but you have to do the `npm install` on
your own machine and upload everything, including the resulting
`node_modules`, to Lambda. This works if all of your dependencies (and
transitive dependencies) are pure JavaScript, but packages with native
dependencies won't run.

Lambda Packager fixes this issue by taking a directory with a
`package.json` file, compiling its dependencies using Lambda itself,
then bundling it all into a zip file that's ready to be uploaded to
a Lambda function.

### Usage

#### Command Line

```sh
lambda-packager my-package output.zip
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

## Thanks

This project was generously sponsored by [Bustle Labs][bustle-labs].

[bustle-labs]: http://www.bustle.com/labs

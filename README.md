# wrap-cli
A npm cli for wrapping factory functions in a [wrap-es5]() module.

## Installation

To install, include this git repository as a dependency for your npm project and `npm install`.

```json
{
  "dependancies":{
     "wrap-cli": "git://github.com/flynnham/wrap-cli.git"
  }
}
```
There are no run-time dependencies besides Node.js.

The package then be automatically fetched from git. The package will automatically update when using `npm update`.

## Usage
To use the script, embed it into the `scripts` portion of you package.json as such:

```json
{
  "scripts": {
    "build:wrap": "wrap-cli ./src/file.js 'module-name' --preserve-console > ./dest/file.js"
  }
}
```

**Unfortunately, right now a glob implementation has not been added, so the wrapper can only process an individual file per
instance**.

### Optional arguments

#### `--preserve-console`
Prevents the cli from replacing instances of `console.log`, `console.warn`, and `console.error` with `__self__.[method]`

#### `--preserve-trailing`
Prevents the removal the last 3 instances of semicolons found in the converted factory.

#### `--preserve-var`
Prevents the wrapper from removing the first instance of `var` from the factory.

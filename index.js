const fs = require('fs');
const path = require('path');

// get critical arguments + argument containing optional args
const optionalArgs = process.argv.splice(2); // get optional arguments
const filePath = optionalArgs.shift(); // get file-path (if it exists)
const moduleName = optionalArgs.shift(); // get module-name (if it exists)

const LOG_NAME = '[flynn-modulizer-cli]';

// check that two required args are available
if (typeof filePath !== "string" || typeof moduleName !== "string"){
    console.error(LOG_NAME, 'Both the "source" and "name" arguments are required. Aborting');
    return new Error('missing arguments'); // error
}

// start processing arguments / configuration
const options = (args => {
    const config = {
        passthrough: false,
        removeFirstVar: true,
        removeTrailing: true,
        injectSelfConsole: true,
        templatePath: './template/1.js',
        es2015: false
    };

    let i = args.length;
    while(i--){
        switch (args[i]) {
            case '--return':
                config.passthrough = true;
                break;
            case '--preserve-var':
                config.removeFirstVar = false;
                break;
            case '--preserve-trailing':
                config.removeTrailing = false;
                break;
            case '--preserve-console':
                config.injectSelfConsole = false;
                break
            case '--es2015':
                config.es2015 = true;
                break;
        }
    }
    return config;
})(optionalArgs);


// if we get to here, the user input has been verified.
// Now we will load/make sure that there is a valid template file
const template = (() => {
    let output = null;
    let templatePath = options.templatePath;

    try {
        // ToDO: consider adding ability to define custom templates
        output = fs.readFileSync(templatePath, 'utf8');
    } catch (e){
        console.error(templatePath)
        // do nothing, since the null variable will be doing that for us.
    }
    return output;
})();

if (typeof template !== "string"){
    console.error(LOG_NAME, 'CRITICAL:', 'constructor template not found or unable to be parsed. Aborting');
    return new Error('invalid template path'); // error
}

//now we will begin processing the factory function
let factory = (() => {
    let output = null;

    // attempt to load the sourceFilelet output = null;
    try {
        // ToDO: consider adding ability to define custom templates
        output = fs.readFileSync(path.join(__dirname, filePath), 'utf8');
    } catch (e){
        // do nothing, since the null variable will be doing that for us.
    }

    if (output){
        // there is data to process

        if (options.removeFirstVar){
            if (options.es2015) {
                output = output.replace(/(const)(.*)(function)/, 'function'); // replace first instance of function;
            } else {
                output = output.replace(/(var)(.*)(function)/, 'function'); // replace first instance of function;
            }
        }

        if (options.removeTrailing){
            let checkTimes = 3;

            while (checkTimes--){
                if (output[output.length - 1] === ';'){
                    output = output.substr(0, output.length - 1);
                    // remove the trailing semicolon
                }
            }
        }

        if (options.injectSelfConsole){
            // replace all instances of console.log, console.error, console.warn with __self__ module reference
            output = output.replace(/console\.log/g, '__self__.log');
            output = output.replace(/console\.warn/g, '__self__.warn');
            output = output.replace(/console\.error/g, '__self__.error');
        }
    }

    return output;
})();

if (typeof factory !== "string"){
    console.error(LOG_NAME, 'CRITICAL:', 'factory (source) not found or unable to be parsed. Aborting');
    return new Error('invalid source path'); // error
}

const REPLACE_NAME = '/#@#_MODULE_NAME_#@#/';
const REPLACE_FACTORY = '/#@#_MODULE_FACTORY_#@#/';

// do the replace (try to recycle the already existent variables)

factory = template.replace(REPLACE_FACTORY, factory); // wrap the factory.
factory = factory.replace(REPLACE_NAME, moduleName);

if (options.passthrough){
    // return the value
    return factory;
} else {
    // log it to the console
    console.log(factory);
    return 0;
}
#! /usr/bin/env node
const fs = require('fs');
const path = require('path');

// get critical arguments + argument containing optional args
const optionalArgs = process.argv.splice(2); // get optional arguments
const filePath = optionalArgs.shift(); // get file-path (if it exists)
const moduleName = optionalArgs.shift(); // get module-name (if it exists)

const LOG_NAME = '[wrap-cli]';

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
        es2015: false,
        beautify: true
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
                break;
            case '--es2015':
                config.es2015 = true;
                break;
            case '--ugly':
                config.beautify = false;
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
        output = fs.readFileSync(path.join(__dirname, templatePath), 'utf8');
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
let segments = (() => {
    let rawText = null;

    // attempt to load the sourceFilelet output = null;
    try {
        // ToDO: consider adding ability to define custom templates
        rawText = fs.readFileSync(filePath, 'utf8');
    } catch (e){
        // do nothing, since the null variable will be doing that for us.
    }

    let output = {};

    if (rawText){
        // there is data to process

        // search for instance of
        const START_TAG = '/*__START_WRAP__*/';
        const END_TAG = '/*__END_WRAP__*/';
        const START_INDEX = rawText.indexOf(START_TAG);
        const END_INDEX = rawText.indexOf(END_TAG);

        console.warn(START_INDEX, END_INDEX)

        if (START_INDEX > -1 && END_INDEX > START_INDEX){
            // the factory needs to be wrapped

            output.outer  = rawText.slice(0, START_INDEX); // the code surrounded by the wrap (and whatever is left over)
            let factoryCode= rawText.slice(START_INDEX, END_INDEX); // the code not surrounded by the wrap

            rawText = null; // clear the rawText

            if (options.removeFirstVar){
                factoryCode = factoryCode.replace(/(const|let|var)(.*)(function)/, 'function'); // replace first instance of function;
            }

            if (options.removeTrailing){
                let lastBracket = factoryCode.lastIndexOf('}');
                factoryCode = factoryCode.substr(0, lastBracket + 1);
            }

            if (options.injectSelfConsole){
                // replace all instances of console.log, console.error, console.warn with __self__ module reference
                factoryCode = factoryCode
                    .replace(/console\.log/g, '__self__.log')
                    .replace(/console\.warn/g, '__self__.warn')
                    .replace(/console\.error/g, '__self__.error');
            }

            output.factory = factoryCode;
        } else {
            // it can't be processed
            output = null;
        }
    }

    return output;
})();

if (typeof segments !== "object" || segments == null){
    console.error(LOG_NAME, 'CRITICAL:', 'factory (source) not found or unable to be parsed. Aborting');
    return new Error('invalid source path'); // error
}

const REPLACE_NAME = '/#@#_MODULE_NAME_#@#/';
const REPLACE_OUTER = '/#@#_MODULE_OUTER_#@#/';
const REPLACE_FACTORY = '/#@#_MODULE_FACTORY_#@#/';

// do the replace (try to recycle the already existent variables)

let output = template
    .replace(REPLACE_NAME, moduleName)
    .replace(REPLACE_OUTER, segments.outer)
    .replace(REPLACE_FACTORY, segments.factory)// wrap the factory.

if (options.beautify){
    const tidy = require('js-beautify').js_beautify;
    output = tidy(output, { indent_size: 4, jslint_happy: true });
}

if (options.passthrough){
    // return the value
    return output;
} else {
    // log it to the console
    console.log(output);
    return 0;
}

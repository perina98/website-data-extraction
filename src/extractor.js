/*
 * File: extractor.js
 * Brief: Application used to extract data from any website. Print help for more info
 * Author: Lukáš Perina
 * Year: 2021
*/


/* 
  Set constant variables and requirements
*/
const fs = require('fs');
const puppeteer = require('puppeteer');
const css = require('css.escape');
const argv = require('minimist')(process.argv.slice(2));
const {exit} = require('process');
const MAX_ANCESTOR = 6;
const MIN_RESLEN = 4;


/* 
  Print help info
*/
function help() {
    console.log(`
Smart WwW data extractor
Brief:
    Based on simple input variables, extract multiple data from any website provided in the data file.

    Data file must be a proper json file and must contain these objects:
        urls                    - array of url strings to extract
        structure{}             - strucuture of items to extract
        blacklist (optional)    - array of blacklisted strings

    Config file must be a proper json file and must contain these objects:
        maxFailRatio            - max fail ratio when determining result class
        format{}                - object containing regex format for each datatype defined in structure
        primary                 - primary object to search for, represented by regex

Usage: node extractor.js --data=data.json [--config=config.json] [-o=output/folder/] [-b] [-d] [-g] [-u] [-m] [-p] [-v] [-h] [--offline] [--noundef]

Default config is ./config.json
Default output folder is ./output

    Available parameters:
        --data    - specify json data file
        --config  - specify own config file
        --offline - set if scraped urls are saved offline / represented by file
        --noundef - delete undefined parts of object
        -o        - specify output location for extracted results
        -v        - verbose output to console
        -h        - prints help info
        -d        - check if datatype already defined in current object
        -g        - try to guess item datatype based on previous results
        -b        - should blacklist be considered
        -u        - unify results
        -m        - strict regex matching check

  The number of items in "urls" is unlimited, number of items in "structure" must match number of items in "items"
  `);
    exit(0);
}

/* 
    Check if everything from input json files is correct and set
*/
function failCheck() {
    if (!urls ||
        !searchItem ||
        !searchStructure ||
        !severity ||
        !format ||
        !primary) {
        return true;
    }
    return false;
}

/* 
    Set program variables
*/
function programVariables(){
    offline = false;        // is file offline?
    verbose = false;        // verbose output
    noUndefined = false;    // remove undefined values from results
    defCheck = false;       // check if result already defined
    guesser = false;        // try to guess resulting datatype
    unify = false;          // unify results
    datasetURLfix = false;  // fix dataset urls
    onlyMatch = false;      // strong regexmatching
    prioritizing = false;
    ancestor = 1;           // default ancestor index

    if (argv.offline)
        offline = true;
    if (argv.v)
        verbose = true;
    if (argv.noundef)
        noUndefined = true;
    if (argv.d)
        defCheck = true;
    if (argv.g)
        guesser = true;
    if (argv.u)
        unify = true;
    if (argv.m)
        onlyMatch = true;
    if (argv.p)
        prioritizing = true;
    if (argv.dataset)
        datasetURLfix = true;
}

/*
  If running datasets, absolute path is needed. This can cause problems when changing pc/folder/user/system
*/
function fixDatasetUrls(urls) {
    let base = 'file:///' + __dirname + '/../';
    return urls.map(element => base + element);
}


/* 
  Check for arguments and their correct representation
*/
function argumentsCheck() {
    if (argv.h)
        help();

    if (argv.data) {
        try {
            data = JSON.parse(fs.readFileSync(argv.data, 'utf8'));
        } catch (err) {
            console.error("Cant open specified data file");
            exit(1);
        }
    } else {
        console.error("Data file not specified. Run with -h to learn more.");
        exit(2);
    }

    if (argv.config) {
        try {
            config = JSON.parse(fs.readFileSync(argv.config, 'utf8'));
        } catch (err) {
            console.error("Cant open specified config file.");
            exit(1);
        }
    } else {
        try {
            config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
        } catch (err) {
            console.error("Cant open default config file.");
            exit(3);
        }
    }

    if (argv.b) {
        blist = true;
        try {
            blacklist = data.blacklist;
            blacklist.length;
        } catch (err) {
            console.error("Blacklisting allowed but blacklist not specified.");
            exit(4);
        }
    } else{
        blist = false; 
    }

    if (argv.o) {
        try {
            output_folder = argv.o;
            if (!fs.existsSync('./' + output_folder)) {
                fs.mkdirSync('./' + output_folder);
            }
        } catch (err) {
            console.error("Cant create or set folder");
            exit(5);
        }
    } else {
        try {
            output_folder = 'output';
            if (!fs.existsSync('./' + output_folder)) {
                fs.mkdirSync('./' + output_folder);
            }
        } catch (err) {
            console.error("Cant create default output folder");
            exit(3);
        }
    }

    programVariables();

    try {
        urls = data.urls;                                   // urls to crawl
        searchItem = Object.keys(data.structure);           // item name prefered by user
        searchStructure = Object.values(data.structure);    // item structure (datatype)
        
        severity = config.maxFailRatio;                     // max fail ratio
        format = config.format;                             // regex format // unique defining format on every site
        primary = config.primary;                           // primary item by which the first search decides where to start
        
        if(datasetURLfix){
            urls = fixDatasetUrls(urls);
        }
        if (failCheck()) {
            console.error("Config or data file error. Run with -h param to learn more.");
            exit(6);
        }
    } catch (err) {
        console.error("Error while reading config and data files.");
        exit(6);
    }
}

/* 
  Expect array of all classes on website, sort them by most used class
  Returns : Sorted array of classes used on site
*/
function getTopClasses(targets) {
    let classes = {};
    let topClasses = [];
    let tLength = targets.length;
    if (tLength == 0){
        return [];
    }
    for (let i = 0; i < tLength; i++) {
        let listLength = Object.keys(targets[i].class_list).length;
        for (let j = 0; j < listLength; j++) {
            if (classes[targets[i].class_list[j]]) {
                classes[targets[i].class_list[j]]++;   // add 1 to the number of times the class appeared in list
            } else {
                classes[targets[i].class_list[j]] = 1; // class appeared in list
            }
        }
    }
    // sort classes by number of times they appeared on website
    let i = 0;
    for (let [key, value] of Object.entries(classes).sort(([, a], [, b]) => b - a)) {
        if (i < tLength) {
            topClasses.push(key);
        }
        i++;
    }
    return topClasses;
}

/* 
  check results array for null values and its failratio
  Returns : true on passed, false on failed.
*/
function checkArrBySeverity(results) {
    let size = results.length;

    if(size == 0){
        return false;
    }

    let bonds = results.filter((obj) => {
        return obj == null;
    }).length;

    let failR = (bonds / size) * 100;

    if (failR < severity) {
        return true;
    } else {
        return false;
    }
}

/* 
    Try to guess datatype based on previous results
*/
function guessDatatype(currentResults, position, max) {
    let proposed = [];
    for (let i = 0; i < max; i++) {
        proposed.push(Object.getOwnPropertyNames(currentResults[i])[position]);
    }

    return proposed.sort(function (a, b) {return a - b})[0];
}

/* 
    Check if input is blacklisted
*/
function blackListed(input){
    for (let k = 0; k < blacklist.length; k++) {
        try{
            if (input.search(blacklist[k]) != -1) {
                return true;
            }
        } catch{
            console.error("Blacklist format error.");
            console.error("Exiting...");
            exit(6);
        }
    }
    return false;
}

/* 
    Define type of the current item
*/
function defineType(input, currentResults, position, max, def) {
    if (blist) {
        if (blackListed(input)) return 'blacklisted';
    }

    let structureSize = searchStructure.length;
    for (let i = 0; i < structureSize; i++) {
        let current = new RegExp(format[searchStructure[i]]);
        if (current.test(input) || current.test(input.trim().replace(/\n*\s*/g, ''))) {
            if (def.includes(searchItem[i])) continue;
            return searchItem[i];
        }
    }
    
    if (guesser) {
        return guessDatatype(currentResults, position, max);
    } else {
        return 'undefined';
    }
}

/* 
    Strict regex matching
*/
function regMatch(type, input) {
    if (type == 'undefined') return input;
    let searchSize = searchItem.length;
    for (let i = 0; i < searchSize; i++) {
        if (type == searchItem[i]) {
            let current = new RegExp(format[searchStructure[i]]);
            try {
                return input.match(current)[0];
            } catch {
                return input;
            }
        }
    }
    return input;
}

/* 
  Prepare json like results for final file
*/
function prepareResults(final_results) {
    let resultsLength = final_results.length;
    for (let i = 0; i < resultsLength; i++) {
        let content = {};
        let def = [];
        let keysLength = Object.keys(final_results[i]).length;
        for (let j = 0; j < keysLength; j++) {
            let type = defineType(final_results[i][j], final_results, j, i, def);
            if (type == 'blacklisted' && blist){
                continue;
            }
            if (defCheck) {
                if (type != 'undefined' && !def.includes(type)) {
                    def.push(type);
                    content[type] = final_results[i][j];
                    if (onlyMatch) {
                        content[type] = regMatch(type, final_results[i][j]);
                    }
                } else {
                    continue;
                }
            } 
            else {
                content[type] = final_results[i][j];
                if (onlyMatch) {
                    content[type] = regMatch(type, final_results[i][j]);
                }
            }
        }
        final_results[i] = content;
        if (noUndefined)
            delete final_results[i].undefined;
    }

    return final_results;
}

/* 
  Check results based on primary selector
*/
function checkResults(results) {
    let re = new RegExp(primary);
    let resultsLength = results.length;
    for (let i = 0; i < resultsLength; i++) {
        if (!re.test(results[i].content)) {
            results[i] = null;
        }
    }
    return results;
}

/* 
    Unify objects, remove possible unnecessary objects containing less than enough info
*/
function unifyObjects(final_results) {
    let size = {};
    let tLength = final_results.length;
    let target;
    let limit = searchItem.length / 2;

    for (let i = 0; i < tLength; i++) {
        let listLength = Object.keys(final_results[i]).length;
        if (size[listLength]) {
            size[listLength]++;
        } else {
            size[listLength] = 1;
        }
    }

    for (let [key, value] of Object.entries(size).sort(([, a], [, b]) => b - a)) {
        if (key > limit) {
            target = key;
            break;
        }
    }

    return final_results = final_results.filter((obj) => {
        return Object.keys(obj).length >= target;
    });
}

/* 
    Prepare querry object for metadata
*/
function prepareQuerry(url, ind, topclass, reslength, determining_time, dumping_time, pageload_time) {
    currentQuerry = {};
    currentQuerry["url"] = url;
    currentQuerry["tested_classes"] = ind;
    currentQuerry["first_target"] = "document.querySelectorAll('." + topclass + "')[0].parentElement.children";
    currentQuerry["target_count"] = reslength;
    currentQuerry["determining_time"] = determining_time + "ms";
    currentQuerry["dumping_time"] = dumping_time + "ms";
    currentQuerry["pageload_time"] = pageload_time + "ms";
    return currentQuerry;
}

/* 
    Output final results to coresponding file in coresponding output folder
*/
function output(url, final_results) {
    try{
        if (offline) {
            url = url.split('/')[url.split('/').length - 1]; // fix file path domain detection for filename
            fs.writeFile(output_folder + '/' + url + '.json', JSON.stringify(final_results, null, 4), 'utf8', err => err ? console.log(err) : null);
        } else {
            fs.writeFile(output_folder + '/' + (new URL(url)).hostname + '.json', JSON.stringify(final_results, null, 4), 'utf8', err => err ? console.log(err) : null);
        }
    } catch{
        console.error("Unable to write output file");
        exit(5);
    }
}

/* 
    Get final results from current page
*/
async function getFinalResults(page, currentSelector) {
    return await page.$$eval(currentSelector, (nodes, ancestor, format, primary, prioritizing) => {
        return nodes.map(node => {
            cnode = node;
            for (let i = 0; i < ancestor; i++) {
                cnode = cnode.parentNode;
            }
            tree = cnode.children;
            treeContent = {};
            x = 0;
            treeLength = tree.length;

            if(prioritizing){
                if (Object.values(format).includes(primary)){
                    treeContent[x] = node.textContent.trim().replace(/\n\s+/g, '');
                    x++;
                }
            }

            for (let i = 0; i < treeLength; i++) {
                if (tree[i].children.length > 0) {
                    subtreeLength = tree[i].children.length;
                    for (let k = 0; k < subtreeLength; k++) {
                        if (tree[i].children[k].textContent.trim() != "") {
                            treeContent[x] = tree[i].children[k].textContent.trim().replace(/\n\s+/g, '');
                            x++;
                        }
                    }
                    continue;
                }
                if (tree[i].textContent.trim() != "") {
                    treeContent[x] = tree[i].textContent.trim().replace(/\n\s+/g, '');
                    x++;
                }
            }
            return treeContent;
        })
    }, ancestor, format, primary, prioritizing);
}

/* 
    Remove duplicates from array
*/
function removeDuplicates(final_results) {
    return [...new Set(final_results.map(el => JSON.stringify(el)))].map(e => JSON.parse(e));
}

/* 
    Dump data into final_results and output them using output function
*/
async function dataDump(page, currentSelector) {
    try {
        final_results = await getFinalResults(page, '.' + currentSelector);
        final_results = removeDuplicates(final_results);
        final_results = prepareResults(final_results);
    } catch (err) {
        console.error(err);
        console.error("Exiting...");
        exit(7);
    }

    if (unifyObjects(final_results).length <= MIN_RESLEN && ancestor < MAX_ANCESTOR) {
        ancestor += 1;
        await dataDump(page, topClasses[ind]);
    }

    if (unify) {
        final_results = unifyObjects(final_results);
    }

    output(url, final_results);
}

/*
    Get all classlists from all nodes on website
*/
async function getClassList(page) {
    return await page.$$eval('[class]', nodes => {
        return nodes.map(node => {
            class_list = node.classList;
            return {
                class_list
            }
        })
    });
}

/*
    Get content of primary selector
*/
async function getPrimaryContent(page){
    return await page.$$eval(currentSelector, nodes => {
        return nodes.map(node => {
            content = node.textContent.trim();
            content = content.replace(/\s/g, '');
            return { content };
        })
    });
}

/* 
    Main process, determine searchclass
*/
async function mainProcess() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    process.on('unhandledRejection', (reason, p) => {
        console.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
        console.error("Exiting...");
        exit(7);
    });

    let querry = [];
    let urlIndex = 0;
    let urlsLength = urls.length;

    // search for top selectors
    console.log("BEGIN PRIMARY EXTRACTION");
    while (urlIndex < urlsLength) {
        url = urls[urlIndex];
        console.log("Current url: " + url);
        ancestor = 1;
        let pageload_start = new Date().getTime();

        try {
            await page.goto(url, {
                waitUntil: "networkidle2",
                timeout: 60000
            });
        } catch (err) {
            console.error("URL " + url + " cant be reached");
            urlIndex++;
            continue;
        }
        let pageload_time = new Date().getTime() - pageload_start;

        if (verbose) console.log("Pageload..." + pageload_time + "ms");

        let determining_start = new Date().getTime();

        let targets = await getClassList(page);
        topClasses = getTopClasses(targets);
        topClassesLength = topClasses.length;
      
        ind = 0;
        do {
            currentSelector = '.' + css(topClasses[ind]);
            try {
                results = await getPrimaryContent(page);
            } catch (err) {
                console.error(err);
            }
            results = checkResults(results);

            if (verbose) console.log(url + " on " + (ind + 1) + " try with class " + topClasses[ind]);
            if (checkArrBySeverity(results)) {
                break;
            }
            ind++;
        } while (ind < topClassesLength)

        let determining_time = new Date().getTime() - determining_start;

        let dumping_start = new Date().getTime();
        await dataDump(page, topClasses[ind]);
        let dumping_time = new Date().getTime() - dumping_start;

        querry.push(prepareQuerry(url, ind, topClasses[ind], results.length, determining_time, dumping_time, pageload_time));
        if (verbose) {
            console.log("Final objects count: " + results.length);
            console.log("Determining possible target..." + determining_time + "ms");
            console.log("Target selector : document.querySelectorAll('." + topClasses[ind] + "')");
            console.log("Dumping data..." + dumping_time + "ms");
            console.log("Resulting class : " + topClasses[ind]);
            console.log("==============================");
        }
        urlIndex++;
    }

    try{
        fs.writeFile(output_folder + '/../metadata.json', JSON.stringify(querry, null, 4), 'utf8', err => err ? console.log(err) : null);
    } catch{
        console.error("Unable to write metadata file");
        exit(5);
    }
    // end
    
    await browser.close();
}

(async function () {
    console.log('Execution started');

    let start_time = new Date().getTime()
    argumentsCheck();
    await mainProcess();
    let exectime = new Date().getTime() - start_time;

    console.log("==============================");
    console.log("Execution ended succesfully. See " + output_folder + '../metadata.json for results overview.');
    console.log('Execution time: ' + exectime + 'ms');
})();

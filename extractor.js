/* 
  Set constant variables and puppeteer requirements
*/
const puppeteer = require('puppeteer');
const fs = require('fs');
const { exit } = require('process');
const { count } = require('console');
const CSS = require('CSS.escape');
const selector = '[class]'; // primary selector, search by classes

/* 
  Print help info
*/
function help() {
    console.log(`
Usage: node extractor.js --data=data.json  [-v] [-h] [--config=config.json] [-o=output/folder/] [--offline] [--nowrite]
    Default config is config.json
    Default output folder is ./output/

    Available parameters:
        --data = Specify json data file
        --config = specify own config file, Default is config.json
        -v   - verbose output to console
        -h   - prints help info
        -o= output location, default ./output
        --offline   - set if scraped urls are saved offline / represented by file
        --nowrite  - if set, script will not output any file

  Smart WwW data extractor
    Brief:
    Based on simple input variables, extract multiple data from any website provided in the data file.
    Data file must be proper json file and must contain these objects:
    * urls
    * structure
    * items

  The number of items in "urls" is unlimited, number of items in "structure" must match number of items in "items"
  `);
    exit(0);
}

/* 
  Check for arguments and their correct representation
*/
function argumentsCheck() {
    var argv = require('minimist')(process.argv.slice(2));

    if (argv.h) {
        help();
    }
    if (argv.offline) {
        offline = true;
    } else {
        offline = false;
    }
    if (argv.nowrite) {
        nowrite = true;
    } else {
        nowrite = false;
    }
    if (argv.v) {
        verbose = true;
    } else {
        verbose = false;
    }

    if (argv.data) {
        try {
            data = JSON.parse(fs.readFileSync(argv.data, 'utf8'));
        } catch (err) {
            console.error("Cant open data file");
            exit(1);
        }
    } else {
        data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    }

    if (argv.config) {
        try {
            config = JSON.parse(fs.readFileSync(argv.config, 'utf8'));
        } catch (err) {
            console.error("Cant open config file");
            exit(1);
        }
    } else {
        try {
            config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
        } catch (err) {
            console.error("Cant open default config file");
            exit(1);
        }
    }

    if (argv.o) {
        try {
            output_folder = argv.o;
            if (!fs.existsSync('./' + output_folder)) {
                fs.mkdirSync('./' + output_folder);
            }
        } catch (err) {
            console.error("Cant create output folder");
            exit(1);
        }
    } else {
        try {
            output_folder = 'output';
            if (!fs.existsSync('./' + output_folder)) {
                fs.mkdirSync('./' + output_folder);
            }
        } catch (err) {
            console.error("Cant create default output folder");
            exit(1);
        }
    }

    if(argv.p){ // parenting on nodes
        parenting = argv.p; // node.parentNode.parentNode.....
    } else{
        parenting = 1; // node.parentNode
    }
    if(argv.noundef){ // delete undefined from results
        noUndefined = true;
    } else{
        noUndefined = false;
    }
    if(argv.d){ // check if type already defined
        defCheck = true;
    } else{
        defCheck = false;
    }
    if (argv.g) { // try to guess item datatype
        guesser = true;
    } else {
        guesser = false;
    }
    if (argv.b) { // try to guess item datatype
        blist = true;
        blacklist = data.blacklist;
    } else {
        blist = false;
    }

    try {
        urls = data.urls;                   // urls to crawl
        searchItem = data.items;            // item name prefered by user
        searchStructure = data.structure;   // item structure (datatype)
        searchLen = data.slen;             // regex format // unique defining format on every site

        severity = config.maxFailRatio;     // max fail ratio
        format = config.format;             // regex format // unique defining format on every site
        primary = config.primary;           // primary item by which the first search decides where to start
    } catch (err) {
        console.error("Error while reading json file.");
        exit(1);
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
    for (let i = 0; i < tLength; i++) {
        let listLength = Object.keys(targets[i].class_list).length;
        for (let j = 0; j < listLength; j++) {
            if (classes[targets[i].class_list[j]]) {
                classes[targets[i].class_list[j]]++;   // add 1 to the number of times the class appeared in list
            } else {
                classes[targets[i].class_list[j]] = 1; // class appeared to list
            }
        }
    }
    var i = 0;
    for (const [key, value] of Object.entries(classes).sort(([, a], [, b]) => b - a)) {
        if (i < tLength) {
            if (isNaN(key[0])) // if classname starts with number, the querryselector needs to have two \\ in front of it to work properly.  
                topClasses.push(key);
            else
                topClasses.push('\\\\' + key)
        }
        i++;
    }
    return topClasses;
}

/* 
  Calculate failRatio of current data
*/
function failRatio(bonds, size) {
    return (bonds / size) * 100;
}

/* 
  check results array for null values and its failratio
  Returns : true on passed, false on failed.
*/
function checkArrBySeverity(results) {
    let size = results.length;
    let bonds = 0;

    for (let i = 0; i < size; i++) {
        if (!(results[i])) bonds++;
    }
    let failR = failRatio(bonds, size);

    if (failR < severity) {
        return true;
    } else {
        return false;
    }

}

/* 
  Define type of the current item
*/
function defineType(input, currentResults, position, max) {
    if (blist) {
        for (let k = 0; k < blacklist.length; k++) {
            if (input == blacklist[k]) {
                return 'undefined';
            }
            if (input.search(blacklist[k]) != -1){
                return 'undefined';
            }
        }
    }
    let structureSize = searchStructure.length;
    for (let i = 0; i < structureSize; i++) {
        let current = new RegExp(format[searchStructure[i]]);
        if (current.test(input) && last != searchItem[i]) {
            if(def.includes(searchItem[i])) continue;
            //if (input.length > searchLen[i]) continue;
            last = searchItem[i];
            //console.log("DEFINING " + input + " TO " + searchItem[i]);
            //console.log(input + " to " + searchItem[i]);
            return searchItem[i];
        }
        if (current.test(input.trim().replace(/\n*\s*/g, '')) && last != searchItem[i]) {
            //if (input.length > searchLen[i]) continue;
            last = searchItem[i];
            //console.log("DEFINING " + input + " TOT " + searchItem[i]);
            return searchItem[i];
        }
    }

    // Try to guess based on past
    let proposed = [];
    for (let i = 0; i < max; i++) {
        proposed.push(Object.getOwnPropertyNames(currentResults[i])[position]);
    }
    let ppp = Math.floor(Math.random() * max);
    //console.log("DEFINING " + input + " TO " + proposed[ppp]);
    if(guesser){
        return proposed[ppp];
    } else{
        return 'undefined';
    }
}

/* 
  Prepare json like results for final file
*/
function prepareResults(final_results) {
    let resultsLength = final_results.length;
    last = '';
    for (let i = 0; i < resultsLength; i++) {
        let content = {};
        def = [];
        for (let j = 0; j < Object.keys(final_results[i]).length; j++) {
            let type = defineType(final_results[i][j], final_results, j, i);
           if(defCheck){ 
                /* if (def.includes(type) && type != 'undefined') {
                    if (content[type].length < final_results[i][j].length) {
                        content[type] = final_results[i][j];
                    }
                    continue;
                } */
               /* if (def.includes(type)){
                   type = defineType(final_results[i][j], final_results, j, i);
               } */
                if (type != 'undefined' && !def.includes(type)){
                    def.push(type);
                    content[type] = final_results[i][j];
                } else{
                    continue;
                }
            }  // shops, maybe differentiete by taking first / last gathered info ? idk
            else{
                content[type] = final_results[i][j];
            }
        }
        //console.log(content);
        final_results[i] = content;
        if(noUndefined)
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

function prepareQuerry(url, ind, topclass, reslength) {
    currentQuerry = {};
    currentQuerry["url"] = url;
    currentQuerry["tested_classes"] = ind;
    currentQuerry["first_target"] = "document.querySelectorAll('." + topclass + "')[0].parentElement.children";
    currentQuerry["target_count"] = reslength;
    return currentQuerry;
}

function output(url, final_results) {
    if (offline) {
        url = url.split('/')[url.split('/').length - 1];// fix for my file path
        fs.writeFile(output_folder + '/targets_' + url + '.json', JSON.stringify(final_results, null, 4), err => err ? console.log(err) : null);
    } else {
        fs.writeFile(output_folder + '/targets_' + (new URL(url)).hostname + '.json', JSON.stringify(final_results, null, 4), err => err ? console.log(err) : null);
    }
}

async function getFinalResults(page, currentSelector) {
    if(parenting == 1){
        results = await page.$$eval(currentSelector, nodes => {
            return nodes.map(node => {
                cnode = node.parentNode;
                /* for(let i = 0; i < parenting;i++){
                    cnode = cnode.parentNode;
                } */
                /* while (cnode.children.length < 3) {
                    cnode = cnode.parentNode;
                    trend++;
                }  */// shops
                tree = cnode.children;
                treeContent = {};
                /* treeContent[0] = node.textContent.trim().replace(/\n\s+/g, ''); */
                x = 0; // shops
                /* x = 0; */
                treeLength = tree.length;
    
                for (i = 0; i < treeLength; i++) {
                    if (tree[i].children.length > 0) {
                        subtreeLength = tree[i].children.length;
                        for (k = 0; k < subtreeLength; k++) {
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
        });
    } else{
        results = await page.$$eval(currentSelector, nodes => {
            return nodes.map(node => {
                cnode = node.parentNode.parentNode;
                /* for(let i = 0; i < parenting;i++){
                    cnode = cnode.parentNode;
                } */
                /* while (cnode.children.length < 3) {
                    cnode = cnode.parentNode;
                    trend++;
                }  */// shops
                tree = cnode.children;
                treeContent = {};
                /* treeContent[0] = node.textContent.trim().replace(/\n\s+/g, ''); */
                x = 0; // shops
                /* x = 0; */
                treeLength = tree.length;
    
                for (i = 0; i < treeLength; i++) {
                    if (tree[i].children.length > 0) {
                        subtreeLength = tree[i].children.length;
                        for (k = 0; k < subtreeLength; k++) {
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
        });
    }
    return results;
}

async function mainProcess() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    process.on('unhandledRejection', (reason, p) => {
        console.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
    });

    urlIndex = 0;
    topSelector = {};
    querry = {};
    urlsLength = urls.length;

    // search for top selectors
    console.log("BEGIN PRIMARY SEARCH");
    while (urlIndex < urlsLength) {
        url = urls[urlIndex];
        console.log("Current url: " + url);
        await page.goto(url, {
            waitUntil: "networkidle2",
            timeout: 60000
        });
        targets = {};
        classList = {};
        topClasses = [];

        targets = await page.$$eval(selector, nodes => {
            return nodes.map(node => {
                class_list = node.classList;
                return {
                    class_list
                }
            })
        });

        topClasses = getTopClasses(targets);
        topClassesLength = topClasses.length;
        if (verbose) {
            console.log("Topclasses:");
            for (var i = 0; i < topClassesLength; i++) {
                console.log(i + ". " + topClasses[i]);
            }
            console.log("==================");
        }
        ind = 0;
        do {
            currentSelector = '.' + CSS(topClasses[ind]);
            if (verbose) console.log(currentSelector);
            try {
                results = await page.$$eval(currentSelector, nodes => {
                    return nodes.map(node => {
                        content = node.textContent.trim();
                        content = content.replace(/\s/g, '');
                        return { content };
                    })
                });
            } catch (err) {
                console.error(err);
            }
            pro_results = JSON.parse(JSON.stringify(results));;
            results = checkResults(results);

            if (checkArrBySeverity(results)) {
                if (verbose) console.log(url + " on " + (ind + 1) + " try with class " + topClasses[ind]);
                results = pro_results;
                break;
            }
            if (verbose) console.log(url + " on " + (ind + 1) + " try with class " + topClasses[ind]);
            ind++;
            if (ind == topClassesLength) break;
        } while (!checkArrBySeverity(results))

        if (verbose) console.log("Target selector : document.querySelectorAll('." + topClasses[ind] + "')");

        querry[url] = prepareQuerry(url, ind, topClasses[ind], results.length);

        topSelector[url] = topClasses[ind];

        if (verbose) console.log(JSON.stringify(topSelector, null, 4));
        urlIndex++;
        if (verbose) console.log("==============================");
    }

    fs.writeFile(output_folder + '/selectors.json', JSON.stringify(querry, null, 4), err => err ? console.log(err) : null);
    console.log("----------------------");
    console.log("BEGIN DATA DUMP");
    urlIndex = 0;
    // begin dumping data
    while (urlIndex < urlsLength) {
        url = urls[urlIndex];
        console.log("Current url: " + url);
        await page.goto(url, {
            waitUntil: "networkidle2",
            timeout: 60000
        });

        currentSelector = '.' + topSelector[url];

        try {
            final_results = await getFinalResults(page, currentSelector).then(results => { return results });
        } catch (err) {
            console.error(err);
        }

        removeDuplicatesFromArray = (final_results) => [...new Set(
            final_results.map(el => JSON.stringify(el))
        )].map(e => JSON.parse(e));
        final_results = removeDuplicatesFromArray(final_results);
        /* console.log(final_results);
        urlIndex++;
        continue; */

        pro_final_results = JSON.parse(JSON.stringify(final_results));

        final_results = prepareResults(final_results);
        if (verbose) console.dir(final_results, { 'maxArrayLength': null });

        output(url, final_results);

        urlIndex++;
    }

    // end

    await browser.close();
}


(async function () {
    console.log('Execution started');
    let start_time = new Date().getTime()
    argumentsCheck();
    await mainProcess();
    console.log("==============================");
    let exectime = new Date().getTime() - start_time;
    console.log('Execution time: ' + exectime + 'ms');
})();

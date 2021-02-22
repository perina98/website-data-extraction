const puppeteer = require('puppeteer');
const selector = '[class]'; // primary selector, search by classes
const fs = require('fs');
const { exit } = require('process');
const { count } = require('console');
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const data = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const urls = data.urls; // urls to crawl
const severity = config.maxFailRatio; // max fail ratio

const searchItem = data.items; // what to search for
const searchStructure = data.structure; // what to search for
const format = config.format; // regex format // unique defining format on every site
const primary = config.primary; // primary item
last = 'xxx';


// get top 10 used classes for current website
// returns array of 10 classes.
function getTopClasses(targets) {
  var classes = {};
  var topClasses = [];

  for (let i = 0; i < targets.length; i++) {
    for (let j = 0; j < Object.keys(targets[i].class_list).length; j++) {
      if (classes[targets[i].class_list[j]]) classes[targets[i].class_list[j]]++;
      else classes[targets[i].class_list[j]] = 1;
    }
  }
  var i = 0;
  for (const [key, value] of Object.entries(classes).sort(([, a], [, b]) => b - a)) {
    if (i < targets.length) {
      if (isNaN(key[0]))
        topClasses.push(key);
      else
        topClasses.push('\\\\' + key)
    }
    i++;
  }
  return topClasses;
}

// async delay time in ms
function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time)
  });
}
function failRatio(bonds, size) {
  return (bonds / size) * 100;
}

function getPathTo(element) {
  if (element.id !== '')
    return 'id("' + element.id + '")';
  if (element === document.body)
    return element.tagName;

  var ix = 0;
  var siblings = element.parentNode.childNodes;
  for (var i = 0; i < siblings.length; i++) {
    var sibling = siblings[i];
    if (sibling === element)
      return getPathTo(element.parentNode) + '/' + element.tagName + '[' + (ix + 1) + ']';
    if (sibling.nodeType === 1 && sibling.tagName === element.tagName)
      ix++;
  }
}

// check results array for null values and its failratio
// returns true on passed, false on failed.
function checkArrBySeverity(results) {
  let size = results.length;
  let bonds = 0;

  for (let i = 0; i < size; i++) {
    if (!(results[i])) bonds++;
  }
  let failR = failRatio(bonds, size);

  if (failR < severity) {
    //console.log("Fail ratio : " + (failR));
    //console.log("Succeeded with " + bonds + " failed results and " + (size - bonds) + " passed results");
    return true;
  } else {
    //console.log("Fail ratio : " + (failR));
    // console.log("Failed with " + bonds + " failed results and " + (size - bonds) + " passed results");
    return false;
  }

}

function defineType(input, currentResults, position, max) {

 

  for (let i = 0; i < searchStructure.length; i++) {
    current = new RegExp(format[searchStructure[i]]);
    if (current.test(input) && last != searchItem[i]) {
      /* console.log(searchItem[i]); */
      last = searchItem[i];
      return searchItem[i];
    }
  }
  for(let k = 0; k < searchStructure.length; k++){
    current = new RegExp(format[searchStructure[k]]);
    console.log(input.trim().replace(/\n*\s*/g, ''));
    if (current.test(input.trim().replace(/\n*\s*/g, ''))) {
      console.log("maybee");
      console.log(searchItem[k]);
      /* exit(); */
      return searchItem[k];
    }
  }
  
  let proposed = [];
  for (let i = 0; i < max; i++) {
    proposed.push(Object.getOwnPropertyNames(currentResults[i])[position]);
  }
  ppp = Math.floor(Math.random() * max);
  if (proposed[ppp] == 'undefined'){

  }
  return proposed[ppp];

}

function prepareResults(final_results) {

  pro_results = final_results;
  time_arr = score_arr = team_arr = [];
  for (let i = 0; i < final_results.length; i++) {
    content = {};
    for (let j = 0; j < Object.keys(final_results[i]).length; j++) {
      // if (content[defineType(final_results[i][j])]) {
      // content[defineType(final_results[i][j]) + "_"+j] = final_results[i][j];
      /*  if (defineType(final_results[i][j]) === "team") {
         if (time_arr[j]) time_arr[j]++;
         else time_arr[j] = 1;
       }  */
      // } else {
      /*    if (defineType(final_results[i][j]) === "team") {
           if (time_arr[j]) time_arr[j]++;
           else time_arr[j] = 1;
         }  */
      content[defineType(final_results[i][j], final_results, j, i)] = final_results[i][j];
      //  }

    }

    final_results[i] = content;
  }


  /* console.log(final_results);
  console.dir(time_arr, { 'maxArrayLength': null });
 
 
 */

  return final_results;
}

//check if results match regex
//return final array
function checkResults(results) {
  re = new RegExp(primary);
  searchfor = searchItem;
  for (let i = 0; i < results.length; i++) {
    if (!re.test(results[i].time)) {
      results[i] = null;
    }
  }
  return results;
}

function getParents(select, page) {
  var parents = {};
  var subparents = {};
  (async function () {
    parents = await page.$$eval(select, nodes => {
      return nodes.map(node => {
        subparents = [];
        target = node.parentNode;
        while (target) {
          subparents.push(target);
          target = target.parentNode;
        }
        return { subparents };
      })
    });
    await delay(500);
  })();
  return parents;
}

(async function () {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
  });
  urlIndex = 0;
  topSelector = {};
  querry = {};


  // search for top selectors
  while (urlIndex < urls.length) {
    url = urls[urlIndex];
    console.log(url);
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000
    });
    targets = {};
    topClasses = [];
    classList = {};

    targets = await page.$$eval(selector, nodes => {
      return nodes.map(node => {
        class_list = node.classList;
        return {
          class_list
        }
      })
    });

    topClasses = getTopClasses(targets);
    for (var i = 0; i < topClasses.length; i++) {
      //console.log(i + ". " + topClasses[i]);
    }
    ind = 0;
    do {
      currentSelector = '.' + topClasses[ind];
      //console.log(currentSelector);
      try {
        results = await page.$$eval(currentSelector, nodes => {
          return nodes.map(node => {
            time = node.textContent.trim();
            time = time.replace(/\s/g, '');
            return { time };
          })
        });
      } catch (err) {
        console.error(err);
      }
      pro_results = JSON.parse(JSON.stringify(results));;
      results = checkResults(results);
      if (checkArrBySeverity(results)) {
        //console.log(url + " on " + (ind + 1) + " try with class " + topClasses[ind]);
        results = pro_results;
        break;
      }
      //console.log(url + " on " + (ind + 1) + " try with class " + topClasses[ind]);
      ind++;
      if (ind == topClasses.length) break;
    } while (!checkArrBySeverity(results))

    console.log("Target selector : document.querySelectorAll('." + topClasses[ind] + "')");

    actualQurry = {};
    actualQurry["url"] = url;
    actualQurry["first_target"] = "document.querySelectorAll('." + topClasses[ind] + "')[0].parentElement.children";

    querry[url] = actualQurry;

    topSelector[url] = topClasses[ind];

    console.log(JSON.stringify(topSelector, null, 4));
    //fs.writeFile('./targets_' + (new URL(url)).hostname + '.json', JSON.stringify(results, null, 4), err => err ? console.log(err) : null);
    urlIndex++;
    console.log("==============================");
  }

  fs.writeFile('./selectors.json', JSON.stringify(querry, null, 4), err => err ? console.log(err) : null);
  console.log("----------------------");
  console.log("BEGIN DATA DUMP");
  urlIndex = 0;
  // begin dumping data
  while (urlIndex < urls.length) {
    url = urls[urlIndex];
    console.log(url);
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    currentSelector = '.' + topSelector[url];

    try {
      final_results = await page.$$eval(currentSelector, nodes => {
        return nodes.map(node => {
          tree = node.parentNode.children;
          treeContent = {};
          x = 0;
          for (i = 0; i < tree.length; i++) {
            if(tree[i].children.length > 0){
              for (k = 0; k < tree[i].children.length; k++) {
                  treeContent[x] = tree[i].children[k].textContent.trim().replace(/\n/g, '');
                  x++;
              }
               continue; 
            }
            if (tree[i].textContent.trim() != "") {
              treeContent[x] = tree[i].textContent.trim().replace(/\n/g, '');
              x++;
            }
          }
          return treeContent;
        })
      });
    } catch (err) {
      console.error(err);
    }
   
    pro_final_results = JSON.parse(JSON.stringify(final_results));
    
    final_results = prepareResults(final_results);
    console.dir(final_results, { 'maxArrayLength': null });
    exit();
    fs.writeFile('./targets_' + (new URL(url)).hostname + '.json', JSON.stringify(final_results, null, 4), err => err ? console.log(err) : null);
    urlIndex++;
    console.log("==============================");
  }


  // end

  await browser.close();
})();

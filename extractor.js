const puppeteer = require('puppeteer');
const selector = '[class]'; // search classes
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const data = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const urls = data.urls; // urls to crawl
const searchItem = data.items; // what to search for
const severity = config.maxFailRatio; // max fail ratio
const format = config.format; // regex format
const dominant = config.dominant; // is the item dominant
const maxClasses = config.maxClasses; // max num of classes to try

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
  if (dominant) {
    for (const [key, value] of Object.entries(classes).sort(([, a], [, b]) => b - a)) {
      if (i < targets.length) {
        if(isNaN(key[0]))
          topClasses.push(key);
        else
          topClasses.push('\\\\' + key)
      }
      i++;
    }
  } else {

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

//check if results match regex
//return final array
function checkResults(results) {
  format_ac = format;
  re = new RegExp(format_ac);
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
      if (checkArrBySeverity(results)){
        //console.log(url + " on " + (ind + 1) + " try with class " + topClasses[ind]);
        results = pro_results;
        break;
      }
      //console.log(url + " on " + (ind + 1) + " try with class " + topClasses[ind]);
      ind++;
      if (ind == topClasses.length) break;
    } while (!checkArrBySeverity(results))

    await delay(100);
    console.log("Target selector : document.querySelectorAll('." + topClasses[ind] +"')");
    fs.writeFile('./targets_' + (new URL(url)).hostname + '.json', JSON.stringify(results, null, 4), err => err ? console.log(err) : null);
    urlIndex++;
    console.log("==============================");
  }

  await browser.close();
})();
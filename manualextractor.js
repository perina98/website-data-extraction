url = "file:///C:/Users/Perina/Documents/materialy_fit/IBT/pupetir/dataset/football/domains/Soccerstand.com.html";

const puppeteer = require('puppeteer');
const fs = require('fs');
const { exit } = require('process');
const { count } = require('console');
const CSS = require('CSS.escape');
const selector = '.event__participant--home'; // primary selector, search by classes


async function mainProcess() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    process.on('unhandledRejection', (reason, p) => {
        console.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
    });

    await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: 60000
    });


    targets = await page.$$eval(selector, nodes => {
        return nodes.map(node => {
            time = node.parentNode.children[1].textContent;
            team1 = node.parentNode.children[2].textContent;
            team2 = node.parentNode.children[3].textContent;
            score = node.parentNode.children[4].textContent;
            return {
                time,team1,team2,score
            }
        })
    });

    pro_results = JSON.stringify(targets);

    console.log(pro_results);
    await browser.close();

}


(async function () {
    await mainProcess();
})();


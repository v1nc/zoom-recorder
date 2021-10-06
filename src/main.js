const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');

// parameter
const headless = true;
const username ="test"

//https://gist.github.com/tokland/d3bae3b6d3c1576d8700405829bbdb52
const escapeXpathString = str => {
  const splitedQuotes = str.replace(/'/g, `', "'", '`);
  return `concat('${splitedQuotes}', '')`;
};
const clickByText = async (page, text) => {
  const escapedText = escapeXpathString(text);
  const linkHandlers = await page.$x(`//a[contains(text(), ${escapedText})]`);
  
  if (linkHandlers.length > 0) {
    await linkHandlers[0].click();
  } else {
    throw new Error(`Link not found: ${text}`);
  }
};

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}


// check passed parameter
if(process.argv.length != 4 && process.argv.length != 3){
  console.log("link or id + password missing!");
  process.exit();
}
var ID,password,link;
if(process.argv.length == 4){
  ID = process.argv[2];
  password = process.argv[3];
  console.log("id:", ID, "password:", password); 
}else if(process.argv.length == 3){
  link = process.argv[2];
  if(!link.includes("zoom")){
    console.log("no valid zoom link!");
    process.exit();
  }
  console.log("link:",link);
}

// initialize browser and plugins
puppeteer.use(StealthPlugin())
puppeteer.use(AdblockerPlugin({ blockTrackers: true }))

// start browser
puppeteer.launch({ headless: headless, executablePath: '/usr/bin/google-chrome',userDataDir: "./user_data"   }).then(async browser => {
  const page = await browser.newPage();
  await page.setViewport({ width: 1680, height: 1050 });

  console.log("visiting invite link");
  await page.goto(link);
  await page.waitForTimeout(3000);
  await clickByText(page, "Join from Your Browser");
  await page.waitForNavigation({waitUntil: "load"});
  await sleep(500);

  // check login status
  if (await page.$("#inputname") !== null){
    // set name
    await page.type("#inputname", username);
    //await sleep(500);
    //await page.click("#rememberMyNameChecked", {clickCount: 1});
    await sleep(500);
    if(await page.$("#joinBtn") !== null){
      await page.click("#joinBtn", {clickCount:1});
      page.waitForNavigation({waitUntil: "load"});
      await sleep(500);
    }
    if(await page.$("#wc_agree1") !== null){
      await page.click("#wc_agree1", {clickCount: 1});
      await page.waitForNavigation({waitUntil: "load"});
      await sleep(500);
    }

  } 

  // screenshot and close
  await page.screenshot({ path: 'status.png', fullPage: true });
  console.log("All done, check status.png");
  if(headless){
    await browser.close();
  }
  
})
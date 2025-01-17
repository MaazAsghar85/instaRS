/*-------------------- Required Libraries -------------------- */

import * as fs from 'fs';
import * as net from 'net';
import { mkdir } from 'fs/promises';
import * as https from 'https';
import * as playwright from 'playwright';
import { execSync } from 'child_process';

/*-------------------- Filteration -------------------- */

function filterFollow(input: string): string[] {
    const lines = input.trim().split('\n');
    const usernames: string[] = [];
    
    usernames.push(lines[0]);
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.toLowerCase() === 'follow') {
            const nextLine = lines[i + 1]?.trim();
            if (nextLine) {
                usernames.push(nextLine);
            }
        }
    }
    return usernames;
}

/*-------------------- Declare and Initialize Variables -------------------- */

//#region Variables

let browser: playwright.Browser[]=[];
let context: playwright.BrowserContext[]=[];
let page: playwright.Page[] =[];
let closedPages: number[] = [];
let closedBrowsers: number[] = [];
let pages=1, browsers=1, k=1;
let env_sleep = 0;
let activeBrowser = 1
let activeWindow = 1;
let islogin = false;

//#endregion Variables
 
/*-------------------- Create Directories -------------------- */

async function createDirectory(directoryName: string, platform: string) {
    try {
      await mkdir(`database/${platform}/${directoryName}/posts`, { recursive: true });
      await mkdir(`database/${platform}/${directoryName}/reels`, { recursive: true });
      await mkdir(`database/${platform}/${directoryName}/followers`, { recursive: true });
      await mkdir(`database/${platform}/${directoryName}/following`, { recursive: true });
      await mkdir(`database/${platform}/${directoryName}/highlights`, { recursive: true });
      console.log(`Directory '${directoryName}' created successfully.`);
    } catch (error) { console.error(`Error creating directory '${directoryName}':`, error); }
}

async function createFollowUserDirectory(directoryName: string, platform: string, follow: string, username: string) {
    try {
        await mkdir(`database/${platform}/${directoryName}/${follow}/${username}/posts`, { recursive: true });
        await mkdir(`database/${platform}/${directoryName}/${follow}/${username}/reels`, { recursive: true });
        await mkdir(`database/${platform}/${directoryName}/${follow}/${username}/followers`, { recursive: true });
        await mkdir(`database/${platform}/${directoryName}/${follow}/${username}/following`, { recursive: true });
        await mkdir(`database/${platform}/${directoryName}/${follow}/${username}/highlights`, { recursive: true });
    } catch (error) { console.error(`Error creating directories`, error); }
}

/*-------------------- Finding Chrome Executable -------------------- */

function findChromePath(): string {
    try {
        switch (process.platform) {
            case 'win32':
                // Tries common paths and uses where command on Windows
                const defaultPathsWindows = [
                    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
                ];
                for (const path of defaultPathsWindows) {
                    if (require('fs').existsSync(path)) {
                        return path;
                    }
                }
                // Using 'where' command if default paths fail
                return execSync('where chrome').toString().split('\n')[0].trim();
            
            case 'darwin':
                // Default path on macOS
                const defaultPathMac = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
                if (require('fs').existsSync(defaultPathMac)) {
                    return defaultPathMac;
                }
                // Using 'which' command if default path fails
                return execSync('which google-chrome').toString().trim();
            
            default:
                return '/usr/bin/google-chrome';
        }
    } catch (error) {
        console.error('Error finding Chrome path:', error);
        return '';
    }
}

/*-------------------- Launch Browsers and Pages -------------------- */

async function launchBrowser() {
    const chromePath = findChromePath();
    if (!chromePath) {
        console.error('Chrome executable not found');
        return;
    }

    browser[browsers] = await playwright.chromium.launch({ slowMo: 500, headless: false, args: ['--window-position = 0,0'],
    executablePath: chromePath});
    context[browsers] = await browser[activeBrowser].newContext({ viewport: {
        width: 1050,
        height: 760
    }});
    page[pages] = await context[activeBrowser].newPage();
    pages++; browsers++;
}

async function LaunchnewPage() {
    if(activeBrowser > 2) {
        page[k] = await context[activeBrowser].newPage();
        k++;
    }
    else {
        page[pages] = await context[activeBrowser].newPage();
        pages++;
    }
}

async function LaunchnewBrowser() {
    browser[browsers] = await playwright.chromium.launch({ headless: false });
    context[browsers] = await browser[browsers].newContext();
    page[k] = await context[browsers].newPage();
    browsers++; k++; pages++;
}

/*-------------------- Data Dumping Functions -------------------- */

async function DownloadUser(username: string, platform: string,  follow: string, directory: string) {

    if (platform == "instagram") {
        let posts: string[] = [];
        let followers: string[] = [];
        let following: string[] = [];
        let SplitData: string[] = [];
        let bio: string[] = [];

        try {
            posts = await page[activeWindow].getByText('posts').allInnerTexts();
            console.log(posts);
        } catch { console.log("Error: Unable to fetch Posts count"); }
        
        try {
            followers = await page[activeWindow].getByText('followers').allInnerTexts();
            console.log(followers);
        } catch { console.log("Error: Unable to fetch Followers count"); }

        try {
            following = await page[activeWindow].getByText('following').allInnerTexts();
            console.log(following);
        } catch { console.log("Error: Unable to fetch Followings count"); }
        
        try {
            await page[activeWindow].getByRole('link', { name: username, exact: true }).click();
            const modal = await page[activeWindow].waitForSelector('.wbloks_1', { timeout: 3000 });
            if (modal) {
                await page[activeWindow].waitForTimeout(2000);
                const Data = await page[activeWindow].innerText('.wbloks_1');
                SplitData = Data.split('\n');
                console.log(SplitData[4]);
                console.log(SplitData[6]);
            }
        } catch { console.log("Error: Unable to fetch joining"); }
        
        try {
            const allText = await page[activeWindow].innerText('.x7a106z');
            const arrayOfLines: string[] = allText.split('\n');
            bio = arrayOfLines;
            console.log(arrayOfLines);
        } catch { console.log("Error: Unable to fetch bio"); }

        const userData = {
            posts: parseInt(posts[0]),
            followers: followers[0].replace(',', ''),
            followings: following[0].replace(',', ''),
            joined: SplitData[4],
            location: SplitData[6],
            fullname: bio[0],
            bio: bio
        }
        const jsonContent = JSON.stringify(userData, null, 2);
        if (follow != 'null') fs.writeFileSync(`database/${platform}/${directory}/${follow}/${username}/UserData.json`, jsonContent, 'utf8');
        else fs.writeFileSync(`database/${platform}/${username}/UserData.json`, jsonContent, 'utf8');

        try { 
            const closeBtn = await page[activeWindow].waitForSelector('role=button[name="Close"]', { timeout: 2000 });
            if (closeBtn) await page[activeWindow].getByRole('button', { name: 'Close' }).click();
            await page[activeWindow].waitForTimeout(1000);
        } catch {}
    }

    else if (platform == "x") {
        const xpaths = {
            fullName: '//*[@id="react-root"]/div/div/div[2]/main/div/div/div/div[1]/div/div[1]/div[1]/div/div/div/div/div/div[2]/div/h2/div/div/div/div/span[1]/span/span[1]',
            username: '//*[@id="react-root"]/div/div/div[2]/main/div/div/div/div[1]/div/div[3]/div/div/div/div/div[2]/div[1]/div/div[2]/div/div/div/span',
            postsCount: '//*[@id="react-root"]/div/div/div[2]/main/div/div/div/div[1]/div/div[1]/div[1]/div/div/div/div/div/div[2]/div/div',
            bio: '//*[@id="react-root"]/div/div/div[2]/main/div/div/div/div[1]/div/div[3]/div/div/div/div/div[3]/div/div',
            location: '//*[@id="react-root"]/div/div/div[2]/main/div/div/div/div[1]/div/div[3]/div/div/div/div/div[3]/div/span[1]/span/span',
            dateJoined: '//*[@id="react-root"]/div/div/div[2]/main/div/div/div/div[1]/div/div[3]/div/div/div/div/div[4]/div/span/span',
            followingCount: '//*[@id="react-root"]/div/div/div[2]/main/div/div/div/div[1]/div/div[3]/div/div/div/div/div[5]/div[1]/a/span[1]/span',
            followersCount: '//*[@id="react-root"]/div/div/div[2]/main/div/div/div/div[1]/div/div[3]/div/div/div/div/div[5]/div[2]/a/span[1]/span',
            subscriptions: '//*[@id="react-root"]/div/div/div[2]/main/div/div/div/div[1]/div/div[3]/div/div/div/div/div[5]/div[3]/a/span[1]/span',
            professionalCategories: '//*[@id="react-root"]/div/div/div[2]/main/div/div/div/div[1]/div/div[3]/div/div/div/div/div[4]/div/span[1]/button/span',
            externalLink: '//*[@id="react-root"]/div/div/div[2]/main/div/div/div/div[1]/div/div[3]/div/div/div/div/div[4]/div/a/span'
        };
    
        const data: { [key: string]: string | null } = {};
    
        const timeout = 1000;

        for (const [key, xpath] of Object.entries(xpaths)) {
            try {
                const element = page[activeWindow].locator(`xpath=${xpath}`).first();
                await element.waitFor({ timeout }); // Wait for the element with a timeout
                data[key] = await element.textContent();
            } catch (error) {
                console.log(`${key} not Found!`);
                data[key] = null;
            }
        }
    
        fs.writeFileSync(`database/${platform}/${username}/UserData.json`, JSON.stringify(data, null, 2));
        console.log(`\nUserData saved: database/${platform}/${username}/UserData.json`);


        ///////////////// Testing /////////////////
        let counter = 1;
        while (1) {
            // Define the XPath
            const age = `//*[@id="react-root"]/div/div/div[2]/main/div/div/div/div[1]/div/div[3]/div/div/section/div/div/div[${counter}]/div/div/article/div/div/div[2]/div[2]/div[1]/div[1]/div[1]/div/div/div[2]/div/div[3]/a/time`;
            const text = `//*[@id="react-root"]/div/div/div[2]/main/div/div/div/div[1]/div/div[3]/div/div/section/div/div/div[${counter}]/div/div/article/div/div/div[2]/div[2]/div[2]/div/span`;
            const replyCount = `//*[@id="react-root"]/div/div/div[2]/main/div/div/div/div[1]/div/div[3]/div/div/section/div/div/div[${counter}]/div/div/article/div/div/div[2]/div[2]/div[4]/div/div/div[1]/button/div/div[2]/span/span/span`;
            const repostCount = `//*[@id="react-root"]/div/div/div[2]/main/div/div/div/div[1]/div/div[3]/div/div/section/div/div/div[${counter}]/div/div/article/div/div/div[2]/div[2]/div[4]/div/div/div[2]/button/div/div[2]/span/span/span`;
            const likeCount = `//*[@id="react-root"]/div/div/div[2]/main/div/div/div/div[1]/div/div[3]/div/div/section/div/div/div[${counter}]/div/div/article/div/div/div[2]/div[2]/div[4]/div/div/div[3]/button/div/div[2]/span/span/span`;
            const viewCount = `//*[@id="react-root"]/div/div/div[2]/main/div/div/div/div[1]/div/div[3]/div/div/section/div/div/div[${counter}]/div/div/article/div/div/div[2]/div[2]/div[4]/div/div/div[4]/a/div/div[2]/span/span/span`;

            try {
                const _age = await page[activeWindow].$eval(age, (element: any) => element.textContent);
                const _text = await page[activeWindow].$eval(text, (element: any) => element.textContent);
                const _replyCount = await page[activeWindow].$eval(replyCount, (element: any) => element.textContent);
                const _repostCount = await page[activeWindow].$eval(repostCount, (element: any) => element.textContent);
                const _likeCount = await page[activeWindow].$eval(likeCount, (element: any) => element.textContent);
                const _viewCount = await page[activeWindow].$eval(viewCount, (element: any) => element.textContent);

                if (_age == null) break;

                // Create an object to store the extracted data
                const tweetData = {
                    age: _age,
                    text: _text,
                    replyCount: _replyCount,
                    repostCount: _repostCount,
                    likeCount: _likeCount,
                    viewCount: _viewCount
                };

                // Convert the object to a JSON string
                const jsonString = JSON.stringify(tweetData, null, 2);

                // Write the JSON string to a file
                fs.writeFile(`database/${platform}/${username}/posts/tweet_${counter}.json`, jsonString, (err) => {
                    if (err) {
                        console.error('Error writing to file', err);
                    } else {
                        console.log(`Successfully wrote to database/${platform}/${username}/tweet_${counter}.json`);
                    }
                });
            } catch { console.log(`xpath ${counter} not found!`); }
            
            counter++;
        }
    }
}

import { IncomingMessage } from 'http'; // Import the IncomingMessage type

async function DownloadInteractions(username: string, platform: string) {
    try {
        // Open the first post
        const openPost = await page[activeWindow].waitForSelector('._aagv', { timeout: 5000 });
        if (openPost) {
            await page[activeWindow].click('._aagv');
            await page[activeWindow].waitForTimeout(2000); // Increased wait time to ensure post loads

            let postCount = 1; // Counter for naming text files sequentially
            const collectedUrls = new Set<string>(); // Set to store unique URLs

            while (true) {
                try {
                    // Wait briefly to ensure elements are loaded properly
                    await page[activeWindow].waitForTimeout(1000);

                    // Fetch the href values of all <a> tags within the specified <ul> element
                    const hrefs = await page[activeWindow].$$eval('ul._a9z6._a9za a', (links) =>
                        links
                            .map((link) => (link as HTMLAnchorElement).href) // Assert the element is an HTMLAnchorElement
                            .filter(
                                (href) =>
                                    href &&
                                    !href.includes('/p/') &&
                                    !href.includes('/explore/') &&
                                    !href.includes('/c/') &&
                                    !href.includes('/reel/')
                            )
                    );

                    // Add unique URLs to the Set
                    hrefs.forEach((href) => collectedUrls.add(href));

                    // Save the unique filtered hrefs to a text file named post1.txt, post2.txt, etc.
                    const filePath = `database/${platform}/${username}/posts/post${postCount}.txt`;
                    fs.writeFileSync(filePath, Array.from(collectedUrls).join('\n'), 'utf-8');
                    console.log(`Saved hrefs to ${filePath}`);

                    // Increment the post count for the next file name
                    postCount++;

                    // Click the next post button
                    const nextPost = await page[activeWindow].waitForSelector('._aaqg', { timeout: 5000 });
                    if (!nextPost) {
                        console.log("End of Posts");
                        break;
                    }

                    await page[activeWindow].click('._aaqg');

                    // Wait to ensure the new post loads completely
                    await page[activeWindow].waitForTimeout(2000);
                } catch (error: unknown) {
                    console.log("Error processing post:", error);
                    break;
                }
            }

            await page[activeWindow].waitForTimeout(2000);
            console.log("Exiting...");
            if (await page[activeWindow].waitForSelector('.x160vmok', { timeout: 5000 })) {
                await page[activeWindow].click('.x160vmok');
            }
        }
    } catch (err: unknown) {
        console.log("Error: Unable to open Post", err);
    }
}

async function DownloadPostText(username: string, platform: string) {
    const readline = require('readline');
    const fs = require('fs');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const question = () => new Promise(resolve => rl.question('\nPress Enter to continue...', resolve));
    try {
        const openPost = await page[activeWindow].waitForSelector('._aagv', { timeout: 2000 });
        if (openPost) {
            await page[activeWindow].click('._aagv');
            await page[activeWindow].waitForTimeout(1000);
            while (1) {
                try {
                    try {
                        const currentUrl: string = page[activeWindow].url();
                        const segments: string[] = currentUrl.split('/').filter(segment => segment.length > 0);
                        const url: string = segments[3];

                        await question();
                        const _a9za = await page[activeWindow].waitForSelector('._a9za', { timeout: 2000 });
                        if (_a9za) {
                            let postsData = await page[activeWindow].innerText('._a9za');
                            await page[activeWindow].waitForTimeout(1000);
                            console.log(postsData);
                            if (postsData) fs.writeFileSync(`database/${platform}/${username}/posts/${url}.txt`, postsData);
                            console.log(`Instagram post data has been stored in database/${platform}/${username}/posts/${url}}.txt`);
                        }
                    } catch { console.log("No Post Data Found!"); }

                    const nextPost = await page[activeWindow].waitForSelector('._aaqg', { timeout: 2000 });
                    if (!nextPost) break;
                    await page[activeWindow].click('._aaqg');
                    await page[activeWindow].waitForTimeout(1000);
                } catch { console.log("End of Posts"); break; }
            }
            await page[activeWindow].waitForTimeout(2000);
            console.log("Exiting...");
            if (await page[activeWindow].waitForSelector('.x160vmok', { timeout: 1000 })) await page[activeWindow].click('.x160vmok');
        }
    } catch { console.log("Error: Unable to open Post"); }
}

async function DownloadPostMedia(username: string, platform: string) {
    try {
        const postImagesSelector = `img.x5yr21d.xu96u03.x10l6tqk.x13vifvy.x87ps6o.xh8yej3`;

        const post = await page[activeWindow].waitForSelector(postImagesSelector, { timeout: 2000 });
        if (post) {
            const postImages = await page[activeWindow].$$eval(postImagesSelector, (imgs) =>
                imgs.map((img) => (img as HTMLImageElement).src).filter(src => src !== undefined && src !== '')
            );
            postImages.forEach(async (url, index) => {
                console.log(`Post ${index + 1} Image URL: ${url}`);
                await page[activeWindow].waitForTimeout(2000);

                if (url) {
                    try {
                        https.get(url, (res) => {
                            const fileStream = fs.createWriteStream(`database/${platform}/${username}/posts/post${index + 1}.jpg`);
                            res.pipe(fileStream);
                        
                            fileStream.on('error', (err) => {
                            console.error('FileStream error:', err);
                            });
                        
                            fileStream.on('finish', () => {
                            fileStream.close();
                            console.log('Download Completed: ', `pic ${index + 1}`);
                            });
                        }).on('error', (err) => { console.error('HTTPS request error:', err); });
                    } catch { console.log("Error: Unable to Download Post Pic"); }
                }
                await page[activeWindow].waitForTimeout(1000);
            });
        }
        else console.log("Error: Unable to Download Post Media!");

        await page[activeWindow].waitForTimeout(3000);
    } catch { console.log("Error: Unable to Download Post Media!"); }
}

async function DownloadPostMediaAll(username: string, platform: string) {
    const postImagesSelector = `img.x5yr21d.xu96u03.x10l6tqk.x13vifvy.x87ps6o.xh8yej3`;
    const urlFilePath = `database/${platform}/${username}/post_urls.txt`;

    // Create a set to keep track of unique URLs
    const urlSet = new Set<string>();

    // Function to save URLs to the text file
    const saveUrlsToFile = (urls: string[]) => {
        urls.forEach((url) => {
            if (!urlSet.has(url)) {
                fs.appendFileSync(urlFilePath, `${url}\n`);
                urlSet.add(url);
            }
        });
    };

    // Step 1: Collect URLs by scrolling
    try {
        let previousHeight = 0;
        let noChangeCount = 0;
        const maxNoChangeCount = 10;

        while (noChangeCount < maxNoChangeCount) {
            // Fetch image URLs on the current view
            const postImages = await page[activeWindow].$$eval(postImagesSelector, (imgs) =>
                imgs.map((img) => (img as HTMLImageElement).src).filter(src => src !== undefined && src !== '')
            );

            // Save fetched URLs to the file
            saveUrlsToFile(postImages);

            // Scroll to the bottom of the page to load more posts
            await page[activeWindow].evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await page[activeWindow].waitForTimeout(2000); // Reduced timeout to 2 seconds

            // Check if the page height has changed after scrolling
            const currentHeight = await page[activeWindow].evaluate(() => document.body.scrollHeight);
            if (currentHeight === previousHeight) {
                noChangeCount++; // Increment the no change counter
            } else {
                noChangeCount = 0; // Reset counter if height changes
                previousHeight = currentHeight; // Update height for the next check
            }
        }

        console.log("Finished collecting URLs. Now downloading images...");

        // Step 2: Read URLs from the file and download images
        const urls = fs.readFileSync(urlFilePath, 'utf-8').split('\n').filter(Boolean);

        for (const [index, url] of urls.entries()) {
            console.log(`Downloading Image ${index + 1} URL: ${url}`);
            await page[activeWindow].waitForTimeout(1000);

            try {
                // Download the image using HTTPS
                https.get(url, (res: IncomingMessage) => {
                    const fileStream = fs.createWriteStream(`database/${platform}/${username}/posts/post${index + 1}.jpg`);
                    res.pipe(fileStream);

                    fileStream.on('error', (err: Error) => {
                        console.error('FileStream error:', err);
                    });

                    fileStream.on('finish', () => {
                        fileStream.close();
                        console.log(`Download Completed: post${index + 1}.jpg`);
                    });
                }).on('error', (err: Error) => {
                    console.error('HTTPS request error:', err);
                });
            } catch (err: unknown) {
                console.log("Error: Unable to Download Post Image", err);
            }
        }
    } catch (err: unknown) {
        console.log("Error: Unable to Download Post Media!", err);
    }
}

async function DownloadReel(username: string, platform: string) {
    const readline = require('readline');
    const fs = require('fs');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const question = () => new Promise(resolve => rl.question('Press Enter to continue...', resolve));
    try {
        const Reels = await page[activeWindow].waitForSelector('role=tab[name="Reels"]', { timeout: 2000 });
        if (Reels) await page[activeWindow].getByRole('tab', { name: 'Reels' }).click();
        else {
            console.log("Error: Unable to Find Reels!");
            return;
        }
        const reel = await page[activeWindow].waitForSelector('div.x1n2onr6.x1lvsgvq.xiy17q3.x18d0r48', { timeout: 2000 });
        if (reel) await page[activeWindow].click('div.x1n2onr6.x1lvsgvq.xiy17q3.x18d0r48');
        else {
            console.log("Error: Unable to Open Reels!");
            return;
        }
        await page[activeWindow].waitForTimeout(1000);
        while (1) {
            try {
                try {
                    const currentUrl: string = page[activeWindow].url();
                    const segments: string[] = currentUrl.split('/').filter(segment => segment.length > 0);
                    const url: string = segments[3];

                    await question();
                    const _a9za = await page[activeWindow].waitForSelector('._a9za', { timeout: 2000 });
                    if (_a9za) {
                        let videoSrc;
                        const video = await page[activeWindow].waitForSelector('video.x1lliihq.x5yr21d.xh8yej3', { timeout: 2000 });
                        if (video) { videoSrc = await page[activeWindow].getAttribute('video.x1lliihq.x5yr21d.xh8yej3', 'src'); }
                        let reelsData = await page[activeWindow].innerText('._a9za');
                        reelsData += `\n${videoSrc}`;
                        console.log(reelsData);
                        fs.writeFileSync(`database/${platform}/${username}/reels/${url}.txt`, reelsData);
                        console.log(`Instagram reel data has been stored in database/${platform}/${username}/reels/${url}.txt`);
                    }
                } catch { console.log("No Reel Data Found!"); }

                const nextReel = await page[activeWindow].waitForSelector('._aaqg', { timeout: 2000 });
                if (!nextReel) break;
                await page[activeWindow].click('._aaqg');
                await page[activeWindow].waitForTimeout(1000);
            } catch { console.log("End of Reels"); break; }
        }
        await page[activeWindow].waitForTimeout(2000);
        console.log("Exiting...");
        if (await page[activeWindow].waitForSelector('.x160vmok', { timeout: 1000 })) await page[activeWindow].click('.x160vmok');
    } catch { console.log("Error: Unable to open Reel"); }
    let Posts = null;
    try { Posts = await page[activeWindow].waitForSelector('role=tab[name="Posts"]', { timeout: 1000 }); } catch {}
    if (Posts) await page[activeWindow].getByRole('tab', { name: 'Posts' }).click();
}

async function DownloadHighlight(username: string, platform: string) {
    const filePath = `database/${platform}/${username}/highlights/H_video_urls.txt`;
    if (fs.existsSync(filePath)) fs.writeFileSync(filePath, '');
    const fss = require('fs').promises;
    let imgHighlight, videoSrc, img = 1;

    try { 
        const highlight = await page[activeWindow].waitForSelector('div.x1upo8f9.xpdipgo.xamitd3.x1n2onr6.x87ps6o.x1ypdohk', { timeout: 2000 });
        if (highlight) await page[activeWindow].click('div.x1upo8f9.xpdipgo.xamitd3.x1n2onr6.x87ps6o.x1ypdohk'); //.x1upo8f9
        else {
            console.log("Error: Unable to open Highlights");
            return;
        }
    } catch {}

    let picCount = 1;
    while (1) {
        try {
            const selector = 'video.x1lliihq.x5yr21d.xh8yej3';
            let Count = 0;
            
            try {
                const vid = await page[activeWindow].waitForSelector(selector, { timeout: 1000 });
                if (vid) Count = await page[activeWindow].locator(selector).count();
            } catch (error) {}
            
            if (Count > 0) {
                videoSrc = await page[activeWindow].getAttribute('video.x1lliihq.x5yr21d.xh8yej3', 'src');
                await page[activeWindow].waitForTimeout(1000);
                console.log(`Video source URL: ${videoSrc}`);
            }
            else {
                const imgSrc = 'img.xl1xv1r.x5yr21d.xmz0i5r.x193iq5w.xh8yej3';
                imgHighlight = await page[activeWindow].getAttribute(imgSrc, 'src');
                await page[activeWindow].waitForTimeout(1000);
                console.log(`Highlight image URL: ${imgHighlight}`);
            }

            if (imgHighlight) {
                try {
                    https.get(imgHighlight, (res) => {
                        const fileStream = fs.createWriteStream(`database/${platform}/${username}/highlights/H_img_${img++}.jpg`);
                        res.pipe(fileStream);
                    
                        fileStream.on('error', (err) => {
                        console.error('FileStream error:', err);
                        });
                    
                        fileStream.on('finish', () => {
                        fileStream.close();
                        console.log('Download Completed: ', `pic ${picCount}`);
                        });
                    }).on('error', (err) => { console.error('HTTPS request error:', err); });
                } catch { console.log("Error: Unable to Download Highlight Pic"); }
            }
            else if (videoSrc) {
                const url: string = page[activeWindow].url();
                console.log(`Video url: ${url}`);
                await fss.appendFile(filePath, `Video source: ${videoSrc}, URL: ${url}\n\n`, 'utf8');
            }
            else break;
        } catch {}
        try { 
            await page[activeWindow].waitForTimeout(1000);
            const nextBtn = await page[activeWindow].waitForSelector('role=button[name="Next"]', { timeout: 1000 });
            if (nextBtn) await page[activeWindow].getByRole('button', { name: 'Next'}).click();
            await page[activeWindow].waitForTimeout(1000);
        } catch { break; }

        imgHighlight = videoSrc = null;
        picCount++;
    } console.log("Exited Highlights");
}

async function DownloadFollow(username: string, platform: string, follow: string, maxScrolls: string) {
    const readline = require('readline');
    const fs = require('fs');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const question = () => new Promise(resolve => rl.question('Press Enter to continue...', resolve));
    try {
        await page[activeWindow].getByText(`${follow}`).click();
        await page[activeWindow].waitForTimeout(2000);
        await page[activeWindow].waitForSelector('.xyi19xy'); //._aano
        const selector = '.xyi19xy';
        let previousHeight = 0, attempts = 0, scrolls = 0, divisor = 0;
        const max = parseInt(maxScrolls);

        if (follow == 'follower') divisor = 6;
        else divisor = 8;

        while (scrolls < max / divisor && attempts < 10) {
            const currentHeight = await page[activeWindow].evaluate((selector) => {
                const element = document.querySelector(selector);
                if (element) {
                    element.scrollTo(0, element.scrollHeight);
                    return element.scrollHeight;
                }
                return 0;
            }, selector);

            console.log(`Current height: ${currentHeight}, Previous height: ${previousHeight}`);
            
            if (currentHeight === previousHeight) { attempts++; scrolls--;} 
            else attempts = 0;
            previousHeight = currentHeight;
            scrolls++;
            await page[activeWindow].waitForTimeout(1000);
        }
        console.log('Stopping scrolling. Either maximum scroll limit reached or no new content.');
    } catch {console.log(`Error: Unable to Open ${follow} Window`);}

    try {
        // await createFollowDirectory(username);
        await question();
        const followData = await page[activeWindow].innerText('.xyi19xy');
        console.log(followData);
        const filteredData = filterFollow(followData);
        fs.writeFileSync(`database/${platform}/${username}/${follow}/usernames.txt`, filteredData.join('\n'));
        console.log(`Usernames extracted and saved to database/${platform}/${username}/${follow}/usernames.txt`);
        try { 
            await page[activeWindow].getByRole('button', { name: 'Close' }).click();
            await page[activeWindow].waitForTimeout(2000);
        } catch {}
    } catch { console.log(`Error: Unable to fetch ${follow} Data`); }

    // await dump_follow(username, follow, 'null');
}

async function dump_follow(username: string, platform: string, follow: string, action: string) {
    if (fs.existsSync(`database/${platform}/${username}/${follow}/usernames.txt`)) {
        const followee = fs.readFileSync(`database/${platform}/${username}/${follow}/usernames.txt`, 'utf-8');

        const followe = followee.split('\n');
        for (const f of followe) {
            try {
                await page[activeWindow].getByRole('link', { name: 'Search' }).click();
                await page[activeWindow].getByPlaceholder('Search').fill(f);
                await page[activeWindow].waitForTimeout(4000);
                await page[activeWindow].click(`a[href*="/${f}/"]`);
                await page[activeWindow].waitForTimeout(3000);
            } catch { console.log(`Error: Unable to Search ${f}`); }

            await createFollowUserDirectory(username, platform,  follow, f);
            if (action == 'u') await DownloadUser(f, platform, follow, username);
            if (action == 'p') await DownloadProfilePic(username, platform, follow, f);
        }
    }
    else { console.log("No such File exists."); }
}

async function DownloadProfilePic(username: string, platform: string, follow: string, fUser: string) {
    
    if (platform == "instagram") {
        let profilePicSelector = `img[src*="sid=7a9f4b"][alt*="'s profile pic"]`;
        const privateIndicator = await page[activeWindow].$('text="This account is private"');

        if (privateIndicator) profilePicSelector = `img[src*="sid=7d3ac5"][alt*="'s profile pic"]`; //alt*="Profile photo"
        const profile = await page[activeWindow].waitForSelector(profilePicSelector);
        let profilePicUrl = null;
        if (profile) {
            profilePicUrl = await page[activeWindow].getAttribute(profilePicSelector, 'src');
            console.log(`Profile Picture URL: ${profilePicUrl}`);
        }
        
        if (profilePicUrl) {
            if (follow == 'null') {
                try {
                    https.get(profilePicUrl, (res) => {
                        const userFileStream = fs.createWriteStream(`database/${platform}/${username}/profilePic.jpg`);
                        
                        res.pipe(userFileStream);
                    
                        userFileStream.on('error', (err) => {
                            console.error('FileStream error:', err);
                        });
                        userFileStream.on('finish', () => {
                            userFileStream.close();
                            console.log('Download Completed:', "pic");
                        });
                    }).on('error', (err) => { console.error('HTTPS request error:', err); });
                } catch { console.log("Error: Unable to Download Profile Pic"); }
            }
            else {
                try {
                    https.get(profilePicUrl, (res) => {
                        const userFileStream = fs.createWriteStream(`database/${platform}/${username}/${follow}/${fUser}/profilePic.jpg`);
                        
                        res.pipe(userFileStream);
                    
                        userFileStream.on('error', (err) => {
                            console.error('FileStream error:', err);
                        });
                        userFileStream.on('finish', () => {
                            userFileStream.close();
                            console.log('Download Completed:', "pic");
                        });
                    }).on('error', (err) => { console.error('HTTPS request error:', err); });
                } catch { console.log("Error: Unable to Download Profile Pic"); }
            }
        }
        await page[activeWindow].waitForTimeout(2000);
    }

    else if (platform == "x" ) {
        const profilePicImgXPath = '//*[@id="react-root"]/div/div/div[2]/main/div/div/div/div[1]/div/div[3]/div/div/div/div/div[1]/div[1]/div[2]/div/div[2]/div/a/div[3]/div/div[2]/div/img';
        const bannerImgXPath = '//*[@id="react-root"]/div/div/div[2]/main/div/div/div/div[1]/div/div[3]/div/div/div/a/div/div[2]/div/img';
        let ImgPathFound = null;
        let BannerPathFound = null;

        try { ImgPathFound = await page[activeWindow].waitForSelector(`xpath=${profilePicImgXPath}`, { timeout: 2000 }); } catch {}
        try { BannerPathFound = await page[activeWindow].waitForSelector(`xpath=${bannerImgXPath}`, { timeout: 2000 }); } catch {}

        if (ImgPathFound == null) {
            console.log("\nProfile Pic cannot be Found!");
        }
        else {
            // Locate the profile picture img element
            const profilePicImgElement = page[activeWindow].locator(`xpath=${profilePicImgXPath}`).first();

            // Extract the src attribute value (profile picture link)
            const profilePicSrc = await profilePicImgElement.getAttribute('src');

            if (profilePicSrc) {
                console.log(`Profile picture src: ${profilePicSrc}`);
            } else {
                console.error('Profile picture src not found');
            }

            if (profilePicSrc) {
                try {
                    https.get(profilePicSrc, (res) => {
                        const userFileStream = fs.createWriteStream(`database/${platform}/${username}/ProfilePic.jpg`);
                        
                        res.pipe(userFileStream);
                    
                        userFileStream.on('error', (err) => {
                            console.error('FileStream error:', err);
                        });
                        userFileStream.on('finish', () => {
                            userFileStream.close();
                            console.log('Download Completed:', "ProfilePic");
                        });
                    }).on('error', (err) => { console.error('HTTPS request error:', err); });
                } catch { console.log("Error: Unable to Download Profile Pic"); }
            } else { console.error('Profile picture link not found'); }
        }

        if (BannerPathFound == null) {
            console.log("\nBanner Pic cannot be Found!");
        }
        else {
            // Locate the profile picture img element
            const bannerImgElement = page[activeWindow].locator(`xpath=${bannerImgXPath}`).first();

            // Extract the src attribute value (profile picture link)
            const bannerSrc = await bannerImgElement.getAttribute('src');

            if (bannerSrc) {
                console.log(`Banner picture src: ${bannerSrc}`);
            } else {
                console.error('Banner picture src not found');
            }

            if (bannerSrc) {
                try {
                    https.get(bannerSrc, (res) => {
                        const userFileStream = fs.createWriteStream(`database/${platform}/${username}/Banner.jpg`);
                        
                        res.pipe(userFileStream);
                    
                        userFileStream.on('error', (err) => {
                            console.error('FileStream error:', err);
                        });
                        userFileStream.on('finish', () => {
                            userFileStream.close();
                            console.log('Download Completed:', "BannerPic");
                        });
                    }).on('error', (err) => { console.error('HTTPS request error:', err); });
                } catch { console.log("Error: Unable to Download Banner Pic"); }
            } else { console.error('Banner picture link not found'); }
        }
    }
}

async function SearchUser(username: string, platform: string) {

    if (platform == "instagram") {
        if (islogin) {
            try {
                try { await page[activeWindow].waitForSelector('input[placeholder="Search"]', { timeout: 2000 }); } 
                catch { await page[activeWindow].getByRole('link', { name: 'Search' }).click(); }
                await page[activeWindow].getByPlaceholder('Search').type(username, { delay: 200 });
                await page[activeWindow].waitForTimeout(1000);
                const user = await page[activeWindow].waitForSelector(`a[href*="/${username}/"]`, { timeout: 2000 });
                if (user) await page[activeWindow].click(`a[href*="/${username}/"]`);
                else console.log(`Error: Unable to Search ${username}`);
            } catch { console.log(`Error: Unable to Search ${username}`); }
        }
    }

    else if (platform == "x") {

    }
}

/*-------------------- Launching the Initial Browser -------------------- */

launchBrowser();

/*-------------------- Creating Socket and Recieving Commands -------------------- */

const server = net.createServer((socket) => {
    console.log('\nType --list to view all the commands.\n');
    socket.on('data', async(data) => {
        const message = data.toString();
        const parts = message.split(' ');
        
        if (parts[0]=='goto'){
            try {
                console.log('Navigating to', parts[1]);
                if (parts[1].startsWith("http")) await page[activeWindow].goto(parts[1]);
                else await page[activeWindow].goto(`https://${parts[1]}`);
                await page[activeWindow].waitForLoadState('networkidle');
                const notNow = await page[activeWindow].waitForSelector('text="Not Now"', { timeout: 2000 });
                if (notNow) await page[activeWindow].getByText("Not Now").click();
            } catch {}
        }
        else if (parts[0] =='login'){
            try {
                islogin = true;
                await page[activeWindow].goto("https://www.instagram.com/accounts/login/");
                await page[activeWindow].fill("input[name='username']", parts[1]);
                await page[activeWindow].fill("input[name='password']", parts[2]);
                await page[activeWindow].click('"Log in"');
            } catch { console.log(`Error: Unable to login ${parts[1]}`); }
        }
        else if (parts[0]=='search'){
            const username = parts[1];
            const currentUrl: string = page[activeWindow].url();
            const platform: string = currentUrl.replace(/^https?:\/\/(www\.)?/, '').split('.')[0];

            SearchUser(username, platform);
        }
        else if (parts[0]=='lp') {
            try { LaunchnewPage(); } 
            catch { console.log("Error: Unable to launch a New Page"); }
        }
        else if (parts[0]=='lb') {
            try { LaunchnewBrowser(); } 
            catch { console.log("Error: Unable to launch a New Browser"); }
        }
        else if (parts[0]=='sap'){
            if (!isNaN(parseInt(parts[1]))) {
                const pageNumber = parseInt(parts[1]);
                if (pageNumber >= 0 && pageNumber < pages) {
                    activeWindow = pageNumber;
                }
                else console.log('Invalid page number:', pageNumber);
            }
            else activeWindow = pages - 1;
        }
        else if (parts[0]=='sab'){
            if (!isNaN(parseInt(parts[1]))) {
                const pageNumber = parseInt(parts[1]);
                if (pageNumber >= 0 && pageNumber < browsers) {
                    activeBrowser = pageNumber;
                }
                else console.log('Invalid page number:', pageNumber);
            }
            else activeBrowser = browsers - 1;
        }
        else if (parts[0]=='cb'){
            try {
                if (!isNaN(parseInt(parts[1]))) {
                    const pageNumber = parseInt(parts[1]);
                    if (pageNumber >= 0 && pageNumber < browsers) {
                        await context[pageNumber].close();
                        await browser[pageNumber].close();
                        closedBrowsers.push(pageNumber);
                    }
                    else console.log('Invalid page number:', pageNumber);
                }
                else{
                    await context[activeBrowser].close();
                    await browser[activeBrowser].close();
                    closedBrowsers.push(activeBrowser);
                }
            } catch { console.log("Error: Unable to close the Browser"); }
        }
        else if (parts[0]=='cp'){
            try {
                if (!isNaN(parseInt(parts[1]))) {
                    const pageNumber = parseInt(parts[1]);
                    if (pageNumber >= 0 && pageNumber < pages) {
                        await page[pageNumber].close();
                        closedPages.push(pageNumber);
                    }
                    else console.log('Invalid page number:', pageNumber);
                }
                else{
                    await page[activeWindow].close();
                    closedPages.push(activeWindow);
                }
            } catch { console.log("Error: Unable to close the Page"); }
        }
        else if (parts[0]=='ss'){
            try { await page[activeWindow].screenshot({path: parts[1]}); }
            catch { console.log("Error: Unable to save screenshot, maybe wrong file extension!"); }
        }
        else if (parts[0]=='scook'){
            try {
                const fs = require('fs');
                const cookies = await page[activeWindow].context().cookies();
                fs.writeFileSync(parts[1], JSON.stringify(cookies, null, 2));
            } catch {
                console.log(`Error: Unable to save cookies to ${parts[1]}`);
            }
        }
        else if (parts[0]=='lcook'){
            try {
                islogin = true;
                const fs = require('fs');
                const cookies = JSON.parse(fs.readFileSync(parts[1], 'utf8'));
                await page[activeWindow].context().addCookies(cookies);
            } catch { console.log(`Error: Unable to load cookies from ${parts[1]}`); }
        }
        else if (parts[0] === 'sd') {
            // Scroll Down
            const value = parseInt(parts[1]);
            if (!isNaN(value) && value > 0) {
                for (let i = 0; i < value; i++) {
                    await page[activeWindow].keyboard.press("PageDown");
                }
            } else {
                console.error('Invalid value for scroll down:', parts[1]);
            }
        }
        else if (parts[0] === 'su') {
            // Scroll Up
            const value = parseInt(parts[1]);
            if (!isNaN(value) && value > 0) {
                for (let i = 0; i < value; i++) {
                    await page[activeWindow].keyboard.press("PageUp");
                }
            } else {
                console.error('Invalid value for scroll up:', parts[1]);
            }
        }        
        else if (parts[0]=='dump'){
            if (islogin) {
                let isPrivate = false;
                try {
                    if (parts[1] != '-r') {
                        const Posts = await page[activeWindow].waitForSelector('role=tab[name="Posts"]', { timeout: 1000 });
                        if (Posts) await page[activeWindow].getByRole('tab', { name: 'Posts' }).click();
                    }
                    await page[activeWindow].waitForTimeout(2000);
                } catch { console.log("Note: It is a Private Account"); isPrivate = true; }

                const currentUrl: string = page[activeWindow].url();
                const segments: string[] = currentUrl.split('/').filter(segment => segment.length > 0);
                const username: string = segments[segments.length - 1];
                const platform: string = currentUrl.replace(/^https?:\/\/(www\.)?/, '').split('.')[0];

                await createDirectory(username, platform);

                if (['-max', '-a', '-t', '-u'].includes(parts[1])) await DownloadUser(username, platform, 'null', 'null');
                if (['-max', '-a', '-m', '-p'].includes(parts[1])) await DownloadProfilePic(username, platform, 'null', 'null');
                if (!isPrivate) {
                    if (['-max', '-a', '-m', '-pm'].includes(parts[1])) await DownloadPostMedia(username, platform);
                    if (['-max', '-a', '-t', '-pt'].includes(parts[1])) await DownloadPostText(username, platform);
                    if (['-max', '-a', '-m', '-pmax'].includes(parts[1])) await DownloadPostMediaAll(username, platform);
                    if (['-max', '-a', '-t', '-pi'].includes(parts[1])) await DownloadInteractions(username, platform);
                    if (['-max', '-a', '-t', '-r'].includes(parts[1])) await DownloadReel(username, platform);
                    if (['-max', '-a', '-m', '-h'].includes(parts[1])) await DownloadHighlight(username, platform);
                    if (['-max', '-f', '-fr'].includes(parts[1])) await DownloadFollow(username, platform, 'followers', parts[2]);
                    if (['-max', '-f', '-fru'].includes(parts[1])) await dump_follow(username, platform, 'followers', 'u');
                    if (['-max', '-f', '-frp'].includes(parts[1])) await dump_follow(username, platform, 'followers', 'p');
                    if (['-max', '-f', '-fg'].includes(parts[1])) await DownloadFollow(username, platform, 'following', parts[2]);
                    if (['-max', '-f', '-fgu'].includes(parts[1])) await dump_follow(username, platform, 'following', 'u');
                    if (['-max', '-f', '-fgp'].includes(parts[1])) await dump_follow(username, platform, 'following', 'p');
                }
            }
            else console.log("Please Login First");
        }
        else if (parts[0]=='lsp'){
            console.log("\nP A G E S\n");
            for (let x = 1; x < pages; x++) {
                if (closedPages.includes(x)) continue;
                else console.log("Page: ",x);
            }
        }
        else if (parts[0]=='lsb'){
            console.log("\nB R O W S E R S\n");
            for (let x = 1; x < browsers; x++) {
                if (closedBrowsers.includes(x)) continue;
                else console.log("Browser: ",x);
            }
        }
        else if (parts[0]=='senv'){
            const env = env_sleep.toString();
            fs.writeFileSync("env.txt", env);
        }
        else if (parts[0]=='lenv'){
            const env = fs.readFileSync("env.txt", 'utf-8');
            env_sleep = parseInt(env);
        }
        else if (parts[0]=='set' && parts[1]=='sleep'){
            const env = parseInt(parts[2]);
            env_sleep = env;
        }
        else if (parts[0]=='--list') {

        }
        else {
            console.log('COMMAND NOT FOUND:', parts[0]);
        }

        if (env_sleep > 0) {
            console.log(`Sleeping for ${env_sleep} seconds...`);
            page[activeWindow].waitForTimeout(env_sleep * 1000);
        }
    });
    socket.on('close', () => { console.log('Connection closed'); });
});

/*-------------------- Establishing Port and Listening for Message -------------------- */

const PORT = 8080;
server.listen(PORT, () => { console.log(`Welcome to InstaRS`); });
const fetch = require('node-fetch');
const cloudinary = require('cloudinary');
const {spawn} = require('child_process');
const {Spinner} = require('cli-spinner');
const path = require('path');

const errors =[];

const spinner = new Spinner('Checking.. %s');
spinner.setSpinnerString('|/-\\');

const formatError = (e) => {
    spinner.stop(true);
    errors.push(e);
    switch (e.code) {
        case "ENOTFOUND":
            //console.dir(e);
            console.log('\x1b[41m%s\x1b[0m',e.message,"\nThe domain is unavailable, it could be blocked by a Firewall or other securety messure")
            break;
        case "GRIDISSUE":
            //console.dir(e);
            console.log('\x1b[41m%s\x1b[0m',e.message,"\nYour domain could not be reach from our server\nIf it's a closed environment please contact your IT/Devops to understand how to open it")
            break;
        default:
            console.log('\x1b[41m%s\x1b[0m', "Error: " + e.message);
            break;
    }
    spinner.start();
};

function formatRes(res) {
    if (res) {
        return `Reached ${res.url}- [Success]`;
    }
};

const postToServices = fetch('https://services.testim.io/auth/signin', {
        method: 'POST',
        body: "{\"email\":\"maorz@testim.io\",\"password\":\"sdfgsdgdsvsczx\",\"captcha\":\"\"}"
    }).catch(formatError);

const uploadImageCloudinary = new Promise((resolve, reject) => {
    cloudinary.config({
        cloud_name: 'dvwokng9v',
        api_key: '719831986524862',
        api_secret: 'LP_dynLaHUkqHRjAUqZK6TvPDoQ'
    });
        cloudinary.v2.uploader.upload('https://res.cloudinary.com/demo/image/upload/yellow_tulip.jpg', (err, res) => {
            if (err) {
                reject(err);
            }
            resolve(res);
        });
    }).then(res => Object.assign(res, {
        url: 'https://api.cloudinary.com',
        status: 200
    })).catch(formatError);

//Check GET request from URLs
const fetchList = () => {
    const urlList = ['https://registry.npmjs.org/@testim%2ftestim-cli',
                    'http://testimstatic.blob.core.windows.net',
                    'https://registry.npmjs.org/ngrok', 
                    'https://app.testim.io', 
                    'https://services.testim.io', 
                    'https://chrome.google.com/webstore/detail/testim-editor/pebeiooilphfmbohdbhbomomkkoghoia', 
                    'https://res.cloudinary.com/demo/image/upload/yellow_tulip.jpg'
                ];
    const responses = urlList.map(item => fetch(item).catch(formatError));
    return responses
}

const testGrid = (baseUrl,gridType) => {
    gridType = gridType == 'public' ? 'Testim-grid-public' : 'Testim-Grid'
    return new Promise((resolve, reject) => {
        const argsArr = [
            path.join("node_modules","@testim","testim-cli","cli.js"),
            "--token", "YwEBgxO6xhPmnCUKPlzbvw8NKbE1sRL75c3zY9DldqWxazu1s7",
            "--project", "QJXWvDZ1YBrsBPZiZPP2",
            "--grid", gridType,
            "--base-url", baseUrl
        ]
        const testimCli = spawn(`node`, argsArr);
        testimCli.on('close', function (code) {
            if (code == 0) {
                resolve({
                    url: baseUrl + ' on ' + gridType,
                });
            } else {
                reject({
                    message: 'Couldn\'t reach ' + baseUrl + ' on ' + gridType,
                    code:'GRIDISSUE'
                });
            };
        });
        testimCli.on('error', function (err) {
            reject(err);
        });
    }).catch(formatError);
}

const main = async () => {
    //Greeting
    console.log('This tool will check if this machine has acsses to our services\n');
    //Logic
    const baseUrl = (process.argv[2]);
    if (baseUrl) {
        spinner.start();
        const promiseArr = [...fetchList(), 
                            uploadImageCloudinary, 
                            postToServices, 
                            testGrid(baseUrl,'public'),
                            testGrid(baseUrl,'trial')                           
                        ];
        Promise.all(promiseArr).then(resList => {
            spinner.stop(true);
            if(resList.some(item => !item)){
                console.log('\x1b[32m%s\x1b[0m', resList.map(formatRes).filter(Boolean).join('\n'));
                console.log('\nNot all services could be reached, please contact your IT/Devops with the error that are marked in red');
            }else{
                console.log('\x1b[32m%s\x1b[0m', resList.map(formatRes).filter(Boolean).join('\n'));
                console.log('\nReached all services, you are good to go :)');
            }
        });
    } else {
        console.log("\x1b[33m%s\x1b[0m", 'Please add your enviroment URL, for example "https://www.google.com"');
    }
};

main();
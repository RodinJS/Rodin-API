/**
 * Created by xgharibyan on 6/27/17.
 */

const fs = require('fs');
const _ = require('lodash');
const config = require('../config/env');

function getUserNameFromEmail(email) {
    const reMatch = /^([^@]*)@/;
    return email.match(reMatch)[1].replace(/[^0-9a-z]/gi, '');

}

function generateCode(codeLength) {
    codeLength = codeLength || 5;
    let text = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    let possible = _.shuffle(characters.split('')).join('');

    for (let i = 0; i < codeLength; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return _.shuffle(text.split('')).join('');
}

function getDefTemplatesObject() {
    const defTemplates = fs.readFileSync('templatesImport.json', 'utf8');
    return JSON.parse(defTemplates);
}

function byteToMb(num) {
    return parseFloat((num / 1024 / 1024).toFixed(2));
}

function convertDate() {
    /*  const monthNames = [
     "January", "February", "March",
     "April", "May", "June", "July",
     "August", "September", "October",
     "November", "December"
     ];*/

    const date = new Date();
    const day = date.getDate();
    const monthIndex = date.getMonth();
    const year = date.getFullYear();

    return (monthIndex + 1) + ' / ' + day + ' / ' + year;
}

function deleteFolderRecursive(path) {
    fs.readdirSync(path).forEach((file) => {
        let curPath = path + '/' + file;
        if (fs.lstatSync(curPath).isDirectory()) { // recurse
            deleteFolderRecursive(curPath);
        } else { // delete file
            fs.unlinkSync(curPath);
        }
    });
    fs.rmdirSync(path);
}

// don't let users crawl up the folder structure by using a/../../../c/d
function cleanUrl(url) {
    url = decodeURIComponent(url);
    let newURL = url.split('../').join('');
    return newURL;
}
// don't let users crawl up the file name by using bar/foo/bar.js
function cleanFileName(name) {
    name = cleanUrl(name);
    let newName = name.split(/[\\\/ / /]+/g);
    return newName[newName.length - 1];
}

function generateFilePath(req, fileName, rootFolder) {
    rootFolder = rootFolder ? config.stuff_path + rootFolder : config.stuff_path + 'projects';
    return rootFolder + '/' + req.user.username + '/' + req.project.root + '/' + cleanUrl(fileName);

}

module.exports = {
    generateCode,
    getDefTemplatesObject,
    byteToMb,
    getUserNameFromEmail,
    convertDate,
    deleteFolderRecursive,
    cleanUrl,
    cleanFileName,
    generateFilePath
};

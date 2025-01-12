const fs = require('fs');
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');

const findTxtFiles = (dir, fileList = []) => {
    // const files = fs.readdirSync(dir);
    // files.forEach(file => {
    //     const filePath = path.join(dir, file);
    //     if (fs.statSync(filePath).isDirectory()) {
    //         // Recursively search within all directories to find any named 'posts'
    //         if (path.basename(filePath) === 'posts' || path.basename(filePath) === 'reels') {
    //             fileList = findTxtFiles(filePath, fileList); // If 'posts', process this directory
    //         } else {
    //             fileList = findTxtFiles(filePath, fileList); // Continue searching in sub-directories
    //         }
    //     } else if ((path.basename(dir) === 'posts' || path.basename(filePath) === 'reels') && filePath.endsWith('.txt')) {
    //         // Only add .txt files that are directly within a 'posts' directory
    //         fileList.push(filePath);
    //     }
    // });
    // return fileList;
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            fileList = findTxtFiles(filePath, fileList);
        } else if (filePath.endsWith('.txt')) {
            fileList.push(filePath);
        }
    });
    return fileList;
};


const parseFileContent = (filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/).filter(line => line.trim() !== '' && !line.includes('Hidden by Instagram') && !line.includes('See translation') && !line.includes('View replies') && !line.includes('Hide replies'));
    const fileName = path.basename(filePath, '.txt');
    let timeRegex = /^(Edited\s*·\s*)?(\d{1,3}[hwd])$/;
    let authorHandle = lines[0];
    let postParts = [];
    let timeFound = false;
    let records = [];
    let index = 1;
    let like = 0;

    while (index < lines.length && !timeFound) {
        if (timeRegex.test(lines[index])) {
            age = lines[index];
            age = age.match(/(\d+[dwsh])/)[1];
            timeFound = true;
            continue;
        }
        postParts.push(lines[index]);
        index++;
    }

    // Generate the current date and time in the format '"YYYY-MM-DD HH:mm:ss"'
    let currentDateTime = new Date();
    let formattedDateTime = '"' + currentDateTime.getFullYear() + '-' + 
                            ('0' + (currentDateTime.getMonth() + 1)).slice(-2) + '-' + 
                            ('0' + currentDateTime.getDate()).slice(-2) + ' ' + 
                            ('0' + currentDateTime.getHours()).slice(-2) + ':' + 
                            ('0' + currentDateTime.getMinutes()).slice(-2) + ':' + 
                            ('0' + currentDateTime.getSeconds()).slice(-2) + '"';

    if (!timeFound || index >= lines.length) {
        console.error("Time line not found or malformed file structure at:", filePath);
        return [];
    }

    let postText = postParts.join('\n').trim();

    let action = null;
    if (lines[lines.length - 1].includes("blob:https://www.instagram.com/")) action = "Reel";
    else action = "Post";

    records.push({
        id: fileName,
        authorHandle,
        age,
        like,
        time: formattedDateTime,  // Custom formatted date and time with quotation marks
        action,
        text: postText || "no caption found"
    });

    index++;
    timeRegex = /^\d+[hwd](\d+)?\s+(like|likes)Reply$/;
    for (let i = index; i < lines.length; i += 3) {
        postParts = [];
        if (i + 2 >= lines.length) break;

        timeFound = false;
        let j = i;
        let like = 0;
        while (j < lines.length && !timeFound) {
            postParts.push(lines[j+1]);
            const substringsToCheck = ['likeReply', 'wReply', 'dReply', 'hReply', 'likesReply'];
            if (substringsToCheck.some(substring => lines[j+2].includes(substring))){//timeRegex.test(lines[j+2])
                age = lines[j+2];
                if (age.includes('likes')) like = age.match(/(\d+)\s+likesReply/)[1];
                else if (age.includes('like')) like = 1;
                age = age.match(/(\d+[dwsh])/)[1]; 
                timeFound = true;
                break;
            }
            j++;
        }

        authorHandle = lines[i];
        postText = postParts.join('\n').trim();
        time = formattedDateTime;  // Reuse the custom formatted date and time with quotation marks
        i = j;

        records.push({
            id: `${fileName}-comment-${Math.floor((i - index) / 3 + 1)}`,
            authorHandle,
            age,
            like,
            time: time,
            action: "comment",
            text: postText || "no comment found"
        });
    }
    return records;
};

const generateCSV = (directoryPath) => {
    const csvWriter = createObjectCsvWriter({
        path: 'allPostData.csv',
        header: [
            { id: 'authorHandle', title: 'Author Handle' },
            { id: 'id', title: 'ID' },
            { id: 'age', title: 'Age'},
            { id: 'like', title: 'Like Count'},
            { id: 'time', title: 'Fetched On' },
            { id: 'action', title: 'Action' },
            { id: 'text', title: 'Text' }
        ]
    });

    const csvWriterFiltered = createObjectCsvWriter({
        path: 'FilteredPostData.csv',
        header: [
            { id: 'authorHandle', title: 'Author Handle' },
            { id: 'id', title: 'ID' },
            { id: 'age', title: 'Age'},
            { id: 'like', title: 'Like Count'},
            { id: 'time', title: 'Fetched On' },
            { id: 'action', title: 'Action' },
            { id: 'text', title: 'Text' }
        ]
    });

    const filterUsernames = ['40lidae', '40lidae_', '_54dableeda', 'teenosatan', 'rugerrudy', '1rugerrudy', 'iam40glockcyou', 'meezybleeda', 'foreverbleeda', 'cobleeda', 'realbleeda_', 'welov3realbleeda', '5xcapone', 'darksideyoungannn', 'darksideyoungan2', 'stepordie', '3km_ded'];

    try {
        const files = findTxtFiles(directoryPath);
        const records = files.flatMap(file => parseFileContent(file));
        
        csvWriter.writeRecords(records)
        .then(() => console.log('The CSV file has been written successfully'))
        .catch(writeErr => console.error('Error writing CSV:', writeErr));
        
        const filteredRecords = records.filter(record => filterUsernames.includes(record.authorHandle));
        
        csvWriterFiltered.writeRecords(filteredRecords)
            .then(() => console.log('Filtered posts data has been written successfully to FilteredPostData.csv'))
            .catch(writeErr => console.error('Error writing filtered posts CSV:', writeErr));
    } catch (err) {
        console.error('An error occurred:', err);
    }
};

generateCSV('./database');


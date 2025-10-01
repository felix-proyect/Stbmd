import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const queueFilePath = path.join(__dirname, '../queue.json');

// Ensure the queue file exists
function initializeQueueFile() {
    if (!fs.existsSync(queueFilePath)) {
        fs.writeFileSync(queueFilePath, JSON.stringify([]), 'utf-8');
    }
}

// Read the entire queue from the file
function readQueue() {
    try {
        const data = fs.readFileSync(queueFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading queue file, returning empty queue:", error);
        return [];
    }
}

// Write the entire queue to the file
function writeQueue(queue) {
    try {
        fs.writeFileSync(queueFilePath, JSON.stringify(queue, null, 2), 'utf-8');
    } catch (error) {
        console.error("Error writing to queue file:", error);
    }
}

// Add a new request to the end of the queue
function addToQueue(request) {
    const queue = readQueue();
    queue.push(request);
    writeQueue(queue);
}

// Get the next request from the front of the queue and remove it
function takeFromQueue() {
    const queue = readQueue();
    if (queue.length === 0) {
        return null;
    }
    const nextRequest = queue.shift(); // Remove the first item
    writeQueue(queue);
    return nextRequest;
}

// Peek at the first item in the queue without removing it
function peekQueue() {
    const queue = readQueue();
    return queue.length > 0 ? queue[0] : null;
}

initializeQueueFile();

export {
    readQueue,
    addToQueue,
    takeFromQueue,
    peekQueue
};
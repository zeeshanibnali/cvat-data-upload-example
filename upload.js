const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const axios = require('axios');
const tus = require('tus-js-client');

// Define the path to your file
const FILE_PATH = path.join(__dirname, 'example.jpeg');
const FILE_SIZE = fs.statSync(FILE_PATH).size;
const FILE_TYPE = mime.lookup(FILE_PATH);

// Replace with your CVAT Task ID
const TASK_ID = '12';
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunk size
const RETRY_DELAYS = [0, 1000, 3000, 5000]; // 5MB chunk size


// Replace with your CVAT UPLOAD_URL
const UPLOAD_URL = `http://localhost:8080/api/tasks/${TASK_ID}/data/`;

// CVAT Token for Authentication
const TOKEN = 'f50bb135da8fcdcf4902f2f37728695d635c02b1'; // Replace with your CVAT TOKEN

// Payload
const IMAGE_QUALITY = 100;

// Step 1: Start the Upload
axios.post(UPLOAD_URL, null, {
    headers: {
        'Authorization': `Token ${TOKEN}`,
        'Upload-Start': 'true'
    }
}).then(response => {
    console.log('Upload started successfully');

    // Step 2: Upload the file using TUS
    const upload = new tus.Upload(fs.createReadStream(FILE_PATH), {
        endpoint: UPLOAD_URL,
        chunkSize: CHUNK_SIZE,
        retryDelays: RETRY_DELAYS,
        headers: {
            'Authorization': `Token ${TOKEN}`,
            'Upload-Length': FILE_SIZE.toString()
        },
        metadata: {
            filename: path.basename(FILE_PATH),
            filetype: FILE_TYPE
        },
        uploadSize: FILE_SIZE,
        onError(error) {
            console.error('Upload failed:', error);
        },
        onProgress(bytesUploaded, bytesTotal) {
            const PERCENTAGE = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
            console.log(`Uploaded: ${PERCENTAGE}%`);
        },
        onSuccess() {
            console.log('Upload completed successfully');

            // Step 3: Finish the Upload
            axios.post(UPLOAD_URL, {
                image_quality: IMAGE_QUALITY,
            }, {
                headers: {
                    'Authorization': `Token ${TOKEN}`,
                    'Upload-Finish': 'true'
                },
            }).then(finishResponse => {
                console.log('Upload finished successfully');
            }).catch(finishError => {
                console.error('Failed to finish upload:', finishError);
            });
        }
    });

    upload.start();

}).catch(startError => {
    console.error('Failed to start upload:', startError);
});

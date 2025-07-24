const express = require('express');
const multer = require('multer');
const { QvdDataFrame } = require('qvd4js');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('qvdfile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const filePath = req.file.path;

    try {
        const df = await QvdDataFrame.fromQvd(filePath);
        const data = await df.toDict();
        res.json(data);
    } catch (error) {
        res.status(500).send(`Error processing QVD file: ${error.message}`);
    } finally {
        // Clean up the uploaded file
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error(`Error deleting file: ${filePath}`, err);
            }
        });
    }
});

const port = 3000;
app.listen(port, () => {
    console.log(`QVD reader service listening on port ${port}`);
});

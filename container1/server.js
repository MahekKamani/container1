const express = require('express');
const fs = require('fs');
const axios = require('axios'); // To send requests to Container 2.
const path = require('path');


const app = express();
const PORT = 6000;

// Middleware to parse JSON request bodies.
app.use(express.json());
// POST endpoint
app.post('/calculate', async (req, res) => {
    const { file, product } = req.body;
    console.log("test");
    // Validate input
    if (!file) {
        return res.status(400).json({ file: null, error: 'Invalid JSON input.' });
    }

    // Construct the file path in the shared volume
    const filePath = path.join('/mahek_PV_dir', file);
    console.log(filePath, 'container1');
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ file, error: `File not found.` });
    }
    console.log("0", file);
    // Forward the file and product parameters to Container 2
    try {
        // Send request to Container 2
        const response = await axios.post('http://container2-service:7000/process', { file, product });
        return res.json(response.data);
    } catch (error) {
        // Check if the error has a response from the server
        if (error.response) {
            // Server responded with an error status
            return res.status(error.response.status).json(error.response.data);
        } else {
            // Connection error or other issues
            return res.status(500).json({ file, error: 'Internal server error: ' + error.message });
        }
    }
});

app.post('/store-file', async (req, res) => {
    const { file, data } = req.body;

    if (!file) {
        return res.status(400).json({
            file: null,
            error: "Invalid JSON input."
        })
    }

    // Construct the file path in the shared volume
    const filePath = path.join('/mahek_PV_dir', file);
    const newData = data?.replaceAll(" ", "") || data;

    // Write data to the file
    fs.writeFile(filePath, newData, (err) => {
        if (err) {
            console.error('Error writing to file:', err.message);
            return res.status(500).json({
                file: file,
                error: "Error while storing the file to the storage."
            });
        }

        // Successfully wrote to the file
        return res.status(200).json({
            file: file,
            message: "Success."
        });
    });

})

// Start the server
app.listen(PORT, () => {
    console.log(`Container 1 is listening on http://localhost:${PORT}`);
});

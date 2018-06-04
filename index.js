const express = require('express');
const log = new (require('lognext'))('server');
const path = require('path');

const PORT = process.env.PORT || 8080;

// Configure app
const app = express();
app.use('/', express.static(path.join(__dirname, 'public')));

log.setUseColor(process.env.USE_LOG_COLOR === 'true');



/* Routes */
app.get('/', (req, res) => res.send('Hello World!'));


// Start service
app.listen(PORT, () => {
	log.writeBox('The Unpapered Home\n\nCustom Order Form');
	log.info(`Running on port ${PORT}`);
});

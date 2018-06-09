const bodyParser = require('body-parser');
const express = require('express');
const log = new (require('lognext'))('server');
const nodemailer = require('nodemailer');
const path = require('path');
const phone = require('phone');

const PORT = process.env.PORT || 8080;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_REGEX = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: EMAIL_USER,
		pass: process.env.EMAIL_PASSWORD
	}
});

// Configure app
const app = express();
app.use(bodyParser.json());
app.use('/', express.static(path.join(__dirname, 'public')));

log.setUseColor(process.env.USE_LOG_COLOR === 'true');



/* Routes */
app.post('/api/orders', (req, res) => {
	try {
		// Validate contact
		const validationErrors = [];
		if (!req.body.name || req.body.name === '') {
			validationErrors.push('Missing required field: Name');
		} else {
			if (req.body.name.length < 6) validationErrors.push('Is your name really that short? Try something longer.');
		}
		if (!req.body.phone || req.body.phone === '') {
			validationErrors.push('Missing required field: Phone Number');
		} else {
			// phone() returns something like [ '+13174351234', 'USA' ] if valid, empty array if not
			if (phone(req.body.phone).length === 0) validationErrors.push('Invalid value: Phone Number. Please use format 555-123-4567');
		}
		if (!req.body.email || req.body.email === '') {
			validationErrors.push('Missing required field: Email Address');
		} else {
			if (!req.body.email.match(EMAIL_REGEX)) validationErrors.push('Invalid value: Email Address');
		}
		if (!req.body.preferredContactMethod || req.body.preferredContactMethod === '') validationErrors.push('Missing required field: Preferred Contact');
		
		// Validate order
		if (!req.body.order) {
			validationErrors.push('You forgot to order something!');
		} else {
			if (!req.body.order.fabric || req.body.order.fabric === '') validationErrors.push('Missing required field: Fabric Information');

			let hasOrder = false;
			if (!Number.isNaN(req.body.order.unpapertowel) && Number.parseInt(req.body.order.unpapertowel) > 0) { 
				hasOrder = true;
				req.body.order.unpapertowel = Number.parseInt(req.body.order.unpapertowel);
			} else {
				req.body.order.unpapertowel = 0;
			}
			if (!Number.isNaN(req.body.order.snackLarge) && Number.parseInt(req.body.order.snackLarge) > 0) { 
				hasOrder = true;
				req.body.order.snackLarge = Number.parseInt(req.body.order.snackLarge);
			} else {
				req.body.order.snackLarge = 0;
			}
			if (!Number.isNaN(req.body.order.snackSmall) && Number.parseInt(req.body.order.snackSmall) > 0) { 
				hasOrder = true;
				req.body.order.snackSmall = Number.parseInt(req.body.order.snackSmall);
			} else {
				req.body.order.snackSmall = 0;
			}
			if (!Number.isNaN(req.body.order.sandwhichWrap) && Number.parseInt(req.body.order.sandwhichWrap) > 0) { 
				hasOrder = true;
				req.body.order.sandwhichWrap = Number.parseInt(req.body.order.sandwhichWrap);
			} else {
				req.body.order.sandwhichWrap = 0;
			}
			if (!Number.isNaN(req.body.order.zipperBag) && Number.parseInt(req.body.order.zipperBag) > 0) { 
				hasOrder = true;
				req.body.order.zipperBag = Number.parseInt(req.body.order.zipperBag);
			} else {
				req.body.order.zipperBag = 0;
			}

			if (!hasOrder) validationErrors.push('You forgot to order something!');
		}

		// Send validation errors
		if (validationErrors.length > 0)
			return res.status(400).send({ validationErrors: validationErrors });

		// Order body
		const preferredContactMethod = req.body.preferredContactMethod === 'email' 
			? 'Email'
			: req.body.preferredContactMethod === 'sms'
				? 'SMS/Text'
				: req.body.preferredContactMethod === 'phone'
					? 'Phone'
					: '';
		let html = '<p>Thank you for placing a custom order with The Unpapered Home! Your order will be reviewed and you will be contacted via your preferred contact method with a final quote. If you have any questions, please reply to this email or get in touch with us on Facebook at <a href="https://www.facebook.com/TheUnpaperedHome/">https://www.facebook.com/TheUnpaperedHome/</a></p>';
		html += '<h1>Contact information</h1>';
		html += '<table>';
		html += `<tr><td style="font-weight: bold">Name</td><td>${req.body.name}</td></tr>`;
		html += `<tr><td style="font-weight: bold">Phone</td><td>${req.body.phone}</td></tr>`;
		html += `<tr><td style="font-weight: bold">Email</td><td>${req.body.email}</td></tr>`;
		html += `<tr><td style="font-weight: bold">Preferred</td><td>${preferredContactMethod}</td></tr>`;
		html += '</table>';
		html += '<h1>Order</h1>';
		html += '<table>';
		html += `<tr><td style="font-weight: bold">Unpaper Towel Rolls</td><td>${req.body.order.unpapertowel}</td></tr>`;
		html += `<tr><td style="font-weight: bold">Snack bags - small</td><td>${req.body.order.snackSmall}</td></tr>`;
		html += `<tr><td style="font-weight: bold">Snack bags - large</td><td>${req.body.order.snackLarge}</td></tr>`;
		html += `<tr><td style="font-weight: bold">Sandwhich Wraps</td><td>${req.body.order.sandwhichWrap}</td></tr>`;
		html += `<tr><td style="font-weight: bold">Zipper Bags</td><td>${req.body.order.zipperBag}</td></tr>`;
		html += '<tr><td style="font-weight: bold" colspan="2">Fabric Information</td></tr>';
		html += `<tr><td colspan="2">${req.body.order.fabric}</td></tr>`;
		html += '</table>';

		// Send email
		const mailOptions = {
			from: EMAIL_USER,
			to: req.body.email,
			cc: EMAIL_USER,
			subject: 'Custom Order - The Unpapered Home',
			html: html
		};
		transporter.sendMail(mailOptions)
			.then((info) => {
				res.sendStatus(200);
			})
			.catch((err) => {
				log.error(err);
				res.sendStatus(500);
			});
	} catch(err) {
		log.error(err);
		res.sendStatus(500);
	}
});


// Start service
app.listen(PORT, () => {
	log.writeBox('The Unpapered Home\n\nCustom Order Form');
	log.info(`Running on port ${PORT}`);	
});

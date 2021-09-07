const express = require('express');
const app = express();
app.use(express.json());
const {
	models: { User, Note },
} = require('./db');
const path = require('path');

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.post('/api/auth', async (req, res, next) => {
	try {
		//console.log('token is defined');
		res.send({ token: await User.authenticate(req.body) });
	} catch (ex) {
		next(ex);
	}
});

app.get('/api/auth', async (req, res, next) => {
	try {
		const token = await User.byToken(req.headers.authorization);
		// console.log("token", token);
		res.send(token);
	} catch (ex) {
		next(ex);
	}
});
//api/auth/:userId/notes
app.get('/api/auth/:userId/notes', async (req, res, next) => {
	try {
		const notes = await Note.findAll({
			where: { userId: req.params.userId },
		});

		res.send(notes);
	} catch (ex) {
		next(ex);
	}
});

app.use((err, req, res, next) => {
	console.log(err);
	res.status(err.status || 500).send({ error: err.message });
});

module.exports = app;

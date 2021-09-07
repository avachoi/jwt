const express = require("express");
const app = express();
app.use(express.json());
const {
	models: { User },
} = require("./db");
const path = require("path");

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

app.post("/api/auth", async (req, res, next) => {
	try {
		console.log("token", { token: await User.authenticate(req.body) });
		res.send({ token: await User.authenticate(req.body) });
	} catch (ex) {
		next(ex);
	}
});

app.get("/api/auth", async (req, res, next) => {
	try {
		const token = await User.byToken(req.headers.authorization);
		// console.log("token", token);
		res.send(token);
	} catch (ex) {
		next(ex);
	}
});

app.use((err, req, res, next) => {
	console.log(err);
	res.status(err.status || 500).send({ error: err.message });
});

module.exports = app;
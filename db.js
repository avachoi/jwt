const Sequelize = require('sequelize');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { STRING } = Sequelize;
const config = {
	logging: false,
};

if (process.env.LOGGING) {
	delete config.logging;
}
const conn = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost/acme_db', config);

const User = conn.define('user', {
	username: STRING,
	password: STRING,
});

const Note = conn.define('note', {
	note: STRING,
});

Note.belongsTo(User);
User.hasMany(Note);

User.byToken = async (token) => {
	try {
		const verifyGood = jwt.verify(token, process.env.JWT);
		console.log('verifyGood', verifyGood);
		const user = await User.findByPk(verifyGood.id);
		if (user) {
			console.log('user', user);
			return user;
		}
		const error = Error('bad credentials');
		error.status = 401;
		throw error;
	} catch (ex) {
		console.log('bad');
		const error = Error('bad credentials');
		error.status = 401;
		throw error;
	}
};

User.authenticate = async ({ username, password }) => {
	try {
		const user = await User.findOne({
			where: {
				username,
				//we don't need to find by password bc it's no longer stored in the db as plain pw
			},
		});

		if (user) {
			//console.log('user exists');
			if (bcrypt.compare(password, user.password)) {
				const token = jwt.sign({ id: user.id }, process.env.JWT);
				return token;
			}
		}
	} catch (error) {
		console.log(error);
	}
	/* const error = Error('bad credentials');
	error.status = 401;
	throw error; */
};

User.beforeCreate(async (user) => {
	const myPlaintextPassword = user.password;
	const hashCode = 10; //Math.floor(Math.random()*10)
	//re-assign the password to the hashed one
	user.password = bcrypt.hash(myPlaintextPassword, hashCode);
});

const syncAndSeed = async () => {
	await conn.sync({ force: true });
	const credentials = [
		{ username: 'lucy', password: 'lucy_pw' },
		{ username: 'moe', password: 'moe_pw' },
		{ username: 'larry', password: 'larry_pw' },
	];
	const [lucy, moe, larry] = await Promise.all(
		credentials.map((credential) => User.create(credential))
	);

	const notes = [
		{ note: `lucy's note` },
		{ note: `moe's note` },
		{ note: `larry's note` },
		{ note: `moe's note again` },
	];
	[lucyNotes, moeNotes, larryNotes, moeNotes2] = await Promise.all(
		notes.map((note) => Note.create(note))
	);

	await lucy.setNotes(lucyNotes);
	await moe.setNotes([moeNotes, moeNotes2]);
	await larry.setNotes(larryNotes);

	return {
		users: {
			lucy,
			moe,
			larry,
		},
		notes: {
			lucyNotes,
			moeNotes,
			larryNotes,
		},
	};
};

module.exports = {
	syncAndSeed,
	models: {
		User,
		Note,
	},
};

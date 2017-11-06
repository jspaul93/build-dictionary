"use strict"

const https = require('https'),
	zlib = require('zlib'),
	he = require('he'),
	fs = require('fs'),
	path = require('path'),
	{execSync} = require('child_process');

fs.writeFileSync('eng.user-words',
	[...new Set([].concat(...require('PgP-Data/data/gyms')
		.map(gym => he.decode(gym.gymName.trim()))
		.map(gym_name => gym_name.split(/\s/)))
		.filter(term => term.length > 0)
		.concat(require('./pokemon')
			.map(pokemon => pokemon.name)
			.filter(name => name !== undefined)
			.map(pokemon_name => `${pokemon_name.charAt(0).toUpperCase()}${pokemon_name.slice(1)}`)))]
		.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
		.join('\n')
);

const gunzip = zlib.createGunzip(),
	download = function (url, dest, cb) {
		const file = fs.createWriteStream(dest);

		https.get(url, response => {
			response
				.pipe(gunzip)
				.pipe(file);
			file.on('finish', () => file.close(cb));
		});
	};

download('https://raw.githubusercontent.com/naptha/tessdata/gh-pages/3.02/eng.traineddata.gz', 'eng.traineddata', () => {
	if (!fs.existsSync(path.join(__dirname, './tessdata'))) {
		fs.mkdirSync(path.join(__dirname, './tessdata'));
	}

	execSync('combine_tessdata -u eng.traineddata ./tessdata/eng.')

	fs.unlinkSync('./eng.traineddata');
	fs.unlinkSync('./tessdata/eng.bigram-dawg');
	fs.unlinkSync('./tessdata/eng.cube-word-dawg');
	fs.unlinkSync('./tessdata/eng.freq-dawg');
	fs.unlinkSync('./tessdata/eng.word-dawg');

	execSync('wordlist2dawg ./eng.user-words ./tessdata/eng.word-dawg ./tessdata/eng.unicharset');

	execSync('combine_tessdata ./tessdata/eng.')

	fs.renameSync('./tessdata/eng.traineddata', './eng.traineddata');
});

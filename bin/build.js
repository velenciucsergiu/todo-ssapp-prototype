const DOSSIER_SEED_FILE_PATH = "./seed";
const BRICK_STORAGE_ENDPOINT = process.env.SSAPPS_FAVORITE_EDFS_ENDPOINT || "http://127.0.0.1:8080";

require("./../../privatesky/psknode/bundles/csbBoot.js");
require("./../../privatesky/psknode/bundles/edfsBar.js");
const fs = require("fs");
const EDFS = require("edfs");

const edfs = EDFS.attachToEndpoint(BRICK_STORAGE_ENDPOINT);

function storeSeed(seed_path, seed, callback) {
	fs.writeFile(seed_path, seed, (err) => {
		return callback(err, seed);
	});
}

function createDossier(callback) {
	edfs.createBar((err, bar) => {
		if (err) {
			return callback(err);
		}

		updateDossier(bar, callback);
	})
}

function updateDossier(bar, callback) {
	bar.delete("/", function(err){
		if(err){
			throw err;
		}

		bar.addFolder("code", "/", (err, archiveDigest) => {
			if (err) {
				return callback(err);
			}

			storeSeed(DOSSIER_SEED_FILE_PATH, bar.getSeed(), callback);
		});
	});
}

function build(callback) {
	fs.readFile(DOSSIER_SEED_FILE_PATH, (err, content) => {
		if (err || content.length === 0) {
			console.log(`Creating a new Dossier...`);
			return createDossier(callback);
		}

		const SEED = require("bar").Seed;
		let seed;
		try {
			seed = new SEED(content);
		} catch (err) {
			console.log("Invalid seed. Creating a new Dossier...");
			return createDossier(callback);
		}

		if(seed.getEndpoint() !== BRICK_STORAGE_ENDPOINT){
			console.log("Endpoint change detected. Creating a new Dossier...");
			return createDossier(callback);
		}

		console.log("Dossier updating...");
		edfs.loadBar(content, (err, bar) => {
			if (err) {
				return callback(err);
			}

			updateDossier(bar, callback);
		});
	});
}

build(function (err, seed) {
	let path = require("path");
	let projectName = path.basename(path.join(__dirname, "../"));
	if (err) {
		console.log(`Build process of <${projectName}> failed.`);
		console.log(err);
		process.exit(1);
	}
	console.log(`Build process of <${projectName}> finished. Dossier Seed:`, seed);
});
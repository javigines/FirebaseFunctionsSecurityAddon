const functions = require('firebase-functions')
const admin = require('firebase-admin')
admin.initializeApp()

var request = require('request')

const config = require('./config')
const db = admin.database()

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

exports.onUserCreation = functions.auth.user().onCreate((user) => {
	let userFunctionsFinalPath = config.paths.userFunctionsPath
		.replace('{userID}', user.uid)
		.replace('{userEmail}', user.email)
		.replace('{userPhone}', user.phoneNumber)

	return db.ref(userFunctionsFinalPath).set({
		x: '',
		p: {},
	})
})

exports.castFunctions = functions.database.ref(config.paths.userFunctionsPath + '/x').onCreate((snapshot, context) => {
	const functionCode = snapshot.val()
	if (functionCode === '') return Promise.resolve()

	const functionExecute = functionsMap[0]
	if (functionExecute === undefined) return Promise.reject('Function Not Found')

	return snapshot.ref.parent
		.child('p')
		.once('value')
		.then((params) => {
			const functionParams = params.val()

			console.debug(functionCode)
			console.debug(functionParams)

			return functionExecute(functionParams)
		})
		.then((response) => {
			return createResponseLink(response)
		})
		.then((responseLink) => {
			return snapshot.ref.parent.set({
				r: responseLink,
			})
		})
})

function createResponseLink(response) {
	var options = {
		method: 'POST',
		url: 'http://snippi.com/add',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		form: {
			title: '',
			language: 'plain',
			expiration: '+10 minutes',
			code: String(response),
		},
	}

	return new Promise(function (resolve, reject) {
		request(options, function (error, response, body) {
			if (error) return reject(error)
			let extractedURL = response.headers['refresh'].split(';url=')[1]
			let rawURL = extractedURL.replace('/s/', '/raw/')

			try {
				return resolve(rawURL)
			} catch (e) {
				console.log(e)
				return reject(e)
			}
		})
	})
}

const helloWorld = function helloWorld() {
	return new Promise((resolve, reject) => {
		return resolve('Hello World')
	})
}

const functionsMap = {
	0: helloWorld,
}

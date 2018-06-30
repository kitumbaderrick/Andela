//Author:Kitumba Derrick

'use strict';

$(document).ready(function (){
	fetchAllCurrencies();
});

/*
|------------------------------------------
| SERVICE WORKER SECTION
|------------------------------------------
*/
// init page and register services worker
if(navigator.serviceWorker){
	// register the services worker
	registerServiceWorker();

	// listen for controller change
	navigator.serviceWorker.addEventListener('controllerchange', function (){
		window.location.reload();
	});

}else{
	console.log('browser does not support Services Worker !');
}

// register sw
function registerServiceWorker() {
	// register the service worker
	navigator.serviceWorker.register('sw.js').then(function(sw) {
		// check service worker controller
		if(!navigator.serviceWorker.controller) return;

		// on waiting state
		if(sw.waiting){
			// updateIsReady(sw.waiting);
			sw.postMessage('message', {action: 'skipWaiting'});
			return;
		}

		// on installing state
		if(sw.installing){
			trackInstalling(sw.installing);
		}

		// on updated found
		sw.addEventListener('updatefound', function (){
			trackInstalling(sw.installing);
		});
	});
}

// track sw state
function trackInstalling(worker) {
	worker.addEventListener('statechange', function(){
		if(worker.state == 'installed'){
			updateIsReady(worker);
		}
	});
}

// update app 
function updateIsReady(sw){
	// console.log('a new SW is ready to take over !');
	// sw.postMessage('message', {action: 'skipWaiting'});
	pushUpdateFound();
}

// push updates
function pushUpdateFound() {
	$(".notify").fadeIn();
  	console.log('sw found some updates.. !');
}



/*
|------------------------------------------
| INDEXED DB SECTION
|------------------------------------------
*/
if (!window.indexedDB) {
    console.log("Your browser doesn't support a stable version of IndexedDB");
}

// open database 
function openDatabase(){
	// return db instances
	const DB_NAME 	= 'cuv';
	const database 	= indexedDB.open(DB_NAME, 1);

	// on error catch errors 
	database.onerror = (event) => {
		console.log('error opening web database');
		return false;
	};

	// check db version
	database.onupgradeneeded = function(event) {
	  	// listen for the event response
	  	var upgradeDB = event.target.result;

	  	// create an objectStore for this database
	  	var objectStore = upgradeDB.createObjectStore("currencies");
	};

	// return db instance
	return database;
}

// save to currencies object
function saveToDatabase(data){
	// init database
	const db = openDatabase();
	
	// on success add user
	db.onsuccess = (event) => {

		// console.log('database has been openned !');
		const query = event.target.result;

	  	// check if already exist symbol
		const currency = query.transaction("currencies").objectStore("currencies").get(data.symbol);

		// wait for users to arrive
	  	currency.onsuccess = (event) => {
	  		const dbData = event.target.result;
	  		const store  = query.transaction("currencies", "readwrite").objectStore("currencies");

	  		if(!dbData){ 
	  			// save data into currency object
				store.add(data, data.symbol);
	  		}else{
	  			// update data existing currency object
				store.put(data, data.symbol);
	  		};
	  	}
	}
}

// fetch from web database
function fetchFromDatabase(symbol, amount) {
	// init database
	const db = openDatabase();
	
	// on success add user
	db.onsuccess = (event) => {

		// console.log('database has been openned !');
		const query = event.target.result;

		// check if already exist symbol
		const currency = query.transaction("currencies").objectStore("currencies").get(symbol);

		// wait for users to arrive
	  	currency.onsuccess = (event) => {
	  		const data = event.target.result;
	  		// console.log(data);
	  		if(data == null){
	  			$(".error_msg").append(`
					<div class="card-feel">
		                <span class="text-danger">
		                	You are currently offline...... check your .internet connectivity and try again.
		                </span>
					</div>
				`);

				// hide error message
				setTimeout((e) => {
					$(".error_msg").html("");
				}, 1000 * 3);

				// void
				return;
	  		}

			// console.log(data);
			// console.log(data);
			let pairs = symbol.split('_');
			let fr = pairs[0];
			let to = pairs[1];

			$(".results").append(`
				<div class="card-feel">
	                <h1 class="small text-center"> <b>${amount}</b> <b>${fr}</b> & <b>${to}</b> converted successfully !</h1>
					<hr />
					Exchange rate for <b>${amount}</b> <b>${fr}</b> to <b>${to}</b> is: <br /> 
					<b>${numeral(amount * data.value).format('0.000')}</b>
				</div>
			`);
	  	}
	}
}

/*
|------------------------------------------
| API SECTION
|------------------------------------------
*/
// all currencies from free.currencyconverterapi.com
const fetchAllCurrencies = (e) => {
	// used es6 Arrow func here..
	$.get('https://free.currencyconverterapi.com/api/v5/currencies', (data) => {
		// if data not fetch
		if(!data) console.log("Could not fetch any data");
		
		// conversion of  pairs to  an array
		const pairs = objectToArray(data.results);

		//  for  loop usage looping thru diffrent currency selected
		for(let val of pairs){
			// template leterals
			$("#from-currency").append(`
				<option value="${val.id}">${val.id} (${val.currencyName})</option>
			`);
			$("#to-currency").append(`
				<option value="${val.id}">${val.id} (${val.currencyName})</option>
			`);
		}
	});
}
//***********************
// currency conversion
//***********************
function convertCurrency(){
	let from 	= $("#from-currency").val();
	let to 		= $("#to-currency").val();
	let amount	= $("#convert-amount").val();

	// restrict user for converting same currency
	if(from == to){
		// console.log('error ');
		$(".error_msg").html(`
			<div class="card-feel">
				<span class="text-danger">
					Ops!, you can't convert the same currency
				</span>
			</div>
		`);

		// hide error message
		setTimeout((e) => {
			$(".error_msg").html("");
		}, 1000 * 3);

		// seaze proccess
		return false;
	}

	//  query building
	let body  = `${from}_${to}`;
	let query = {
		q: body
	};

	//***********************
// currency conversion
//***********************
	$.get('https://free.currencyconverterapi.com/api/v5/convert', query, (data) => {
		//  array conversion
		const pairs = objectToArray(data.results);

		// iteration of  pairs
		$.each(pairs, function(index, val) {
			$(".results").append(`
				<div class="card-feel">
                    <h1 class="small text-center"> <b>${amount}</b>  <b>${val.fr}</b> to <b>${val.to}</b> converted successfully !</h1>
					<hr />
					Exchange rate for <b>${amount}</b> <b>${val.fr}</b> to <b>${val.to}</b> is: <br /> 
					<b>${numeral(amount * val.val).format('0.000')}</b>
				</div>
			`);

			// storing object results 
			let object = {
				symbol: body,
				value: val.val
			};

			// database storage 
			saveToDatabase(object);
		});
	}).fail((err) => {
		// Check currencies in indexedDB
		fetchFromDatabase(body, amount);
	});

	// nothing 
	return false;
}

//  generatoring array using map & arrow functions
function objectToArray(objects) {
	// Body
	const results = Object.keys(objects).map(i => objects[i]);
	return results;
}

// refresh 
function refreshPage() {
	// Body
	window.location.reload();
}

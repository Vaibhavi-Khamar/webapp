// const loadtest = require('loadtest');

// const options = {
// 	url: 'http://prod.vaibhavikhamar.me/v1/bill',
// 	concurrency: 500,
//     method: 'POST',
//     headers: {
// 		'Content-Type': 'application/json',
// 		'Authorization': 'Basic cnlhbi5mb3hAZXhhbXBsZS5jb206dGVzdHJ5YW5mb3g='
//       },
//     body: JSON.stringify({"vendor":"NEU","bill_date":"2020-01-08","due_date":"2020-01-27","amount_due":7000,"categories":["college","tution","spring2019"],"payment_status":"paid"}),
	
// 	requestsPerSecond:5,
// 	//maxSeconds:30,
	
// };

// loadtest.loadTest(options, (error, results) => {
// 	if (error) {
// 		return console.error('Got an error: %s', error);
// 	}
//     console.log(results);
//     console.log(results.body);
// 	console.log('Tests run successfully');
// });


// //testserver-loadtest
// //loadtest http://dev.vaibhavikhamar.me/v1/bill  -c 500 -k --rps 200
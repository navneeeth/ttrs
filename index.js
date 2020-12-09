// using express frame work to run server
var express = require("express");
// used for cross origin scripting
const cors = require('cors');
// used to make http request to
const nodeRequest = require('request');
var app = express();
app.use(cors());

var pickedUpArray = {};
// Rapid API key here
const rapidApiTrendsTwitterApikey = '';
// Rapid api host
const rapidApiTrendsTwitterApiHost = 'onurmatik-twitter-trends-archive-v1.p.rapidapi.com';
// Rapid api url
const rapidApiTrendsTwitterApiUrl = 'https://onurmatik-twitter-trends-archive-v1.p.rapidapi.com/download';
// Port to run server
const port = 3000;
const numberOfUniqueHashtagsKeyToBeAccessed = 10;
 //csv columns names and indexes for the twitter trend returned
const idxKey = 0, idxPlaceName = 1, idxPlaceType = 2, idxDate = 3 , idxTime = 4, idxHits = 5;
// start the server
app.listen(port, () => {
    console.log("Server running on port " + port );

});

app.get("/getTrends", (request, response, next) => {
    console.log("Received Get trends request for Country : " + request.query.country  + " Date  : " + request.query.date)

    getDataUrl(  request.query.country , request.query.date  ).then( dataUrl => {

        getTrendsData(dataUrl).then( topTrends => {

                    response.json( topTrends ) ;

                    pickedUpArray = {};

        });
    });
});

function getDataUrl( country, date ){
    return new Promise( function (resolve, reject) {

        var options = {
            method: 'GET',
            uri: rapidApiTrendsTwitterApiUrl,
            qs: {   country: country, date: date },
            headers: {
                        'x-rapidapi-host': rapidApiTrendsTwitterApiHost,
                        'x-rapidapi-key': rapidApiTrendsTwitterApikey,
                        useQueryString: true
                    }
       };

       nodeRequest(options, function (error, response, body) {

                    if (error) throw new Error(error);

                    resolve( JSON.parse( body).uri );

       });
   });
}

function getTrendsData( dataUrl ){
    var options = {
        method: 'GET',
        uri: dataUrl,
        headers: {
                    useQueryString: true
                    }
    };

    return new Promise( function (resolve, reject){

       nodeRequest(options,  function (error, res, body) {

       if (error) { console.log("error in response") ;throw new Error(error);}

           var trendsData = body.toString()
                                    .split('\n') // split string to lines
                                    .map(e => e.trim()) // remove white spaces for each line
                                    .map(e => e.split(',').map(e => e.trim())); // split each line to array
           var sortedArray =   trendsData.sort(function(a, b) { return Number(b[idxHits]) - Number(a[idxHits])   });

           // Sorted array has trends for same key at different time slots during the day.
           // so need to iterate the array till we get top ten
           var i = 0, j = 0;
           var key = '';
           var arrayLength = sortedArray.length;


           //KEYS are case sensitive.
           while( i < numberOfUniqueHashtagsKeyToBeAccessed && j < arrayLength ){

              if( sortedArray[j][idxKey] != key && !pickedUpArray[sortedArray[j][idxKey]]
                && sortedArray[j][idxKey].length != 0
                && sortedArray[j][idxHits].length != 0 ){

                  key = sortedArray[j][idxKey];

                  pickedUpArray[sortedArray[j][idxKey]] = {
                        placeName : sortedArray[j][idxPlaceName],
                        placeType : sortedArray[j][idxPlaceType],
                        date : sortedArray[j][idxDate],
                        time : sortedArray[j][idxTime],
                        hits : sortedArray[j][idxHits],
                  }


                  i++;

              }

              j++;

            }

            resolve(pickedUpArray);

        });
   });
}

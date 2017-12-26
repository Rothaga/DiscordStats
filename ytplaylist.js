module.exports = function(api_key) {

    const https = require('https');
    const YOUR_API_KEY = api_key;

    /**
     * Builds a query string for making youtube API call
     *
     * @param {any} url
     * @param {any} params
     * @returns queryString
     */
    function buildQueryString(url, params) {
        let queryString = url + '?';

        for (let key in params) {
            if (params.hasOwnProperty(key)) {
                queryString += key + '=' + params[key] + '&';
                queryString += (key === 'key') ? '' : '&';
            }
        }

        return queryString;
    }


    /**
     * Makes a get request to url
     *
     * @param {any} apiUrl
     * @returns a promise
     */
    function getRequest(apiUrl) {
        let parsed;
        return new Promise((resolve, reject) => {
            https.get(apiUrl, function(res) {
                    let body = ''; // Will contain the final response
                    // Received data is a buffer.
                    // Adding it to our body
                    res.on('data', function(data) {
                        body += data;

                    });
                    // After the response is completed, parse it and log it to the console
                    res.on('end', function() {
                        parsed = JSON.parse(body);
                        resolve(parsed);
                    });
                })
                // If any error has occured, log error to console
                .on('error', function(e) {
                    reject(e.message);
                    console.log('Got error: ' + e.message);
                });
        });

    }




    /**
     * Finds number of videos & videos
     * information in the playlist
     *
     * @param {any} id
     * @param {any} [pageToken=null]
     * @returns onject containing playlist information
     */
    function parsePlaylist(id, pageToken = null) {
        let result; //contains list of all vidos in playlist

        let apiUrl = 'https://www.googleapis.com/youtube/v3/playlistItems';
        let params = {
            'playlistId': id,
            'maxResults': 50,
            'pageToken': (pageToken == null) ? '' : pageToken,
            'part': 'snippet,contentDetails',
            'key': YOUR_API_KEY,

        };

        let queryString = buildQueryString(apiUrl, params);
        console.log(queryString);

        let numOfReq = 1;

        return new Promise((resolve, reject) => {
            getRequest(queryString).then((res) => {
                if (numOfReq > 1) {

                    for (let myKey in res.items) {
                        if (res.items.hasOwnProperty(myKey)) {
                            result.items.push(res.items[myKey]);
                        }
                    }
                    numOfReq = numOfReq + 1;

                } else {
                    result = res;
                    resolve(result);
                }
                //till all videos are retrived
                if (res.hasOwnProperty('nextPageToken')) {
                    parsePlaylist(id, res.nextPageToken);
                }
            }).catch((err) => {
                console.log(err);
                reject(err);
            });
        });

    }

    return {
        parsePlaylist: parsePlaylist,
    }
}

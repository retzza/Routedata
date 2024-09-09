
const uploadBtn = document.getElementById("uploadBtn");
const drawBtn = document.getElementById("drawRoutesBtn");
const clearBtn = document.getElementById("clearAll");
const chooseFiles = document.getElementById("fileInput")

let walkingSessions = [];
let runningSessions = [];
let cyclingSessions = [];
let otherSessions = [];

let walkingDistance = 0;
let runningDistance = 0;
let cyclingDistance = 0;
let otherDistance = 0;
let totalDistance = 0;

let types = {};
let walkingSessionCoordinates = [];
let runningSessionCoordinates = [];
let cyclingSessionCoordinates = [];
let otherSessionCoordinates = [];
let otherSports = [];
let firstDate = null;
let lastDate = null;

let walkIndex = 0;
let runIndex = 0;
let cyclingIndex = 0;
let otherIndex = 0;
let totalRoutes = 0;

const map = L.map('map');

// create map background
map.setView([62.242630, 25.747358], 13);  // kompassi
// map.setView([64.220903, 27.710765], 14); // Kajaani
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);


/**
 * Eventlistener for button "Upload"
 */
uploadBtn.addEventListener('click', () => {
    // choose files
    const files = [];
    const arr = document.querySelector('input[type="file"]').files;
    for (file of arr) {
        files.push(file);
    }

    // read files and sort them by sport
    for (let file of files) {
        if (file.name.includes("training-session")) {
            fetch('./training_sessions/' + file.name)
                .then(res => res.json())
                .then(data => {
                    // calculate first day
                    if (firstDate === null)
                        firstDate = data.startTime;
                    if (isFirstEarlierthanSecond(data.startTime, firstDate) === true) {
                        firstDate = data.startTime;
                    }
                    document.getElementById("firstDateLabel").innerHTML =
                        showDate(firstDate, ".");

                    // calculate last day
                    if (lastDate === null)
                        lastDate = data.startTime;
                    if (isFirstEarlierthanSecond(data.startTime, lastDate) === false) {
                        lastDate = data.startTime;
                    }
                    document.getElementById("lastDateLabel").innerHTML =
                        showDate(lastDate, ".");

                    // log data only if there's a recordedRoute
                    if ("recordedRoute" in data.exercises[0].samples) {
                        // sort sports to their own arrays
                        var sport = data.exercises[0].sport;
                        if (sport === "WALKING") {
                            //walkingSessions.push(data);
                            var walkCoordIndex = 0;
                            walkingSessionCoordinates[walkIndex] = [];
                            data.exercises[0].samples.recordedRoute.forEach(routePoint => {
                                walkingSessionCoordinates[walkIndex][walkCoordIndex] = [
                                    routePoint.latitude,
                                    routePoint.longitude
                                ];
                                walkCoordIndex++;
                            })
                            walkIndex++;
                            // update statistics
                            walkingDistance += data.distance;
                            document.getElementById("walkingRoutes").innerHTML = walkIndex;
                            document.getElementById("walkingDistance").innerHTML = (walkingDistance / 1000.0).toFixed(3) + " km";
                            updateTotals(data.distance);
                        }

                        else if (sport === "RUNNING" || sport === "JOGGING") {
                            //runningSessions.push(data);
                            var runCoordIndex = 0;
                            runningSessionCoordinates[runIndex] = [];
                            data.exercises[0].samples.recordedRoute.forEach(routePoint => {
                                runningSessionCoordinates[runIndex][runCoordIndex] = [
                                    routePoint.latitude,
                                    routePoint.longitude
                                ];
                                runCoordIndex++;
                            })
                            runIndex++;
                            // update statistics
                            runningDistance += data.distance;
                            document.getElementById("runningRoutes").innerHTML = runIndex;
                            document.getElementById("runningDistance").innerHTML = (runningDistance / 1000.0).toFixed(3) + " km";
                            updateTotals(data.distance);
                        }

                        else if (sport === "CYCLING" || sport === "ROAD_BIKING") {
                            //cyclingSessions.push(data);
                            var cyclingCoordIndex = 0;
                            cyclingSessionCoordinates[cyclingIndex] = [];
                            data.exercises[0].samples.recordedRoute.forEach(routePoint => {
                                cyclingSessionCoordinates[cyclingIndex][cyclingCoordIndex] = [
                                    routePoint.latitude,
                                    routePoint.longitude
                                ];
                                cyclingCoordIndex++;
                            })
                            cyclingIndex++;
                            // update statistics
                            cyclingDistance += data.distance;
                            document.getElementById("cyclingRoutes").innerHTML = cyclingIndex;
                            document.getElementById("cyclingDistance").innerHTML = (cyclingDistance / 1000.0).toFixed(3) + " km"
                            updateTotals(data.distance);
                        }

                        else {
                            //otherSessions.push(data);
                            var otherCoordIndex = 0;
                            otherSessionCoordinates[otherIndex] = [];
                            data.exercises[0].samples.recordedRoute.forEach(routePoint => {
                                otherSessionCoordinates[otherIndex][otherCoordIndex] = [
                                    routePoint.latitude,
                                    routePoint.longitude
                                ];
                                otherCoordIndex++;
                            })
                            otherIndex++;
                            // update statistics
                            otherDistance += data.distance;
                            document.getElementById("otherRoutes").innerHTML = otherIndex;
                            document.getElementById("otherDistance").innerHTML = (otherDistance / 1000.0).toFixed(3) + " km"
                            updateTotals(data.distance);

                            // for other sports, list the types
                            otherSports.push(sport);
                            otherSports = removeDuplicates(otherSports);
                            var lowerCase = []
                            for (var i = 0; i < otherSports.length; i++) {
                                var neww = replaceWith(otherSports[i], "_", " ");
                                neww = replaceWith(neww, "_", " "); // has to be done twice since cross country skiing has two dashes
                                neww = replaceWith(neww, "XC", "Cross-country"); // to make cross-country skiing better
                                lowerCase[i] = capitalizeFirstLetter(neww);
                            }
                            var list = "";
                            for (let i of lowerCase) {
                                list += `<li>${i}</li>`;
                            }
                            document.getElementById("otherSportsList").innerHTML = list;
                        }
                    }
                });
        }
    }
})


/**
 * Eventlistener for button "Show routes"
 */
drawBtn.addEventListener('click', () => {
    // clear map before 
    clearMap();

    // get checked boxes
    let types = {};
    document.querySelectorAll('[type="checkbox"]').forEach(item => {
        if (item.checked === true) {
            types[item.value] = true;
        } else if (item.checked === false) {
            types[item.value] = false;
        }
    })

    if (types.Walking === true) {
        for (var i = 0; i < walkingSessionCoordinates.length; i++) {
            var polyline = L.polyline(walkingSessionCoordinates[i],
                {
                    color: 'red'
                })
                .addTo(map);
        }
    }

    if (types.Running === true) {
        for (var i = 0; i < runningSessionCoordinates.length; i++) {
            var polyline = L.polyline(runningSessionCoordinates[i],
                {
                    color: 'blue'
                })
                .addTo(map);
        }
    }

    if (types.Cycling === true) {
        for (var i = 0; i < cyclingSessionCoordinates.length; i++) {
            var polyline = L.polyline(cyclingSessionCoordinates[i],
                {
                    color: 'green'
                })
                .addTo(map);
        }
    }

    if (types.Other === true) {
        for (var i = 0; i < otherSessionCoordinates.length; i++) {
            var polyline = L.polyline(otherSessionCoordinates[i],
                {
                    color: 'purple'
                })
                .addTo(map);
        }
    }
})


/**
 * Eventlistener for button "Clear"
 */
clearBtn.addEventListener('click', () => {
    clearMap();
    resetAll();
})


/**
 * Updates totals to the statistics
 * @param {number} distance - distance added
 */
function updateTotals(distance) {
    totalDistance += distance;
    document.getElementById("totalDistance").innerHTML = (totalDistance / 1000.0).toFixed(3) + " km";
    totalRoutes++;
    document.getElementById("totalRoutes").innerHTML = totalRoutes;
}


/**
 * Removes duplicates from an array
 * @param {any[]} arr - array 
 * @returns {any[]} array
 */
function removeDuplicates(arr) {
    let outputArray = arr.filter(function (v, i, self) {
        // Returns the index of the first
        // instance of each value
        return i == self.indexOf(v);
    });

    return outputArray;
}


/**
 * Capitalizes the first letter of a sring
 * @param {string} string - string  
 * @returns {string} String with first letter capitalized.
 */
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}


/**
 * Replaces the first instance of a substring from another string with a given replacement
 * @param {string} str - string to modify 
 * @param {string} toReplace - substring to be replaced 
 * @param {string} replacement - substring to replace  
 * @returns {string} modified string
 */
function replaceWith(str, toReplace, replacement) {
    var index = str.indexOf(toReplace);
    if (index === -1) {
        return str;
    }
    return str.substring(0, index) + replacement + str.substring(index + toReplace.length);
}


/**
 * Checks if first date is earlier than second
 * @param {string} date1 - first date
 * @param {string} date2 - second date
 * @returns {string} true, if first date is earlier, false otherwise
 */
function isFirstEarlierthanSecond(date1, date2) {
    var splitted1 = date1.split("-");
    var year1 = splitted1[0];
    var month1 = splitted1[1];
    var splitday1 = splitted1[2].split("T");
    var day1 = splitday1[0];

    var splitted2 = date2.split("-");
    var year2 = splitted2[0];
    var month2 = splitted2[1];
    var splitday2 = splitted2[2].split("T");
    var day2 = splitday2[0];

    if (year1 > year2) return false;
    if (year1 === year2 && month1 > month2) return false;
    if (year1 === year2 && month1 === month2 && day1 > day2) return false;
    return true;
}


/**
 * Writes a date in a readable form
 * @param {string} date - date to display 
 * @param {string} splitter - character to split day, month and year
 * @returns {string} modified string
 */
function showDate(date, splitter) {
    var splitted = date.split("-");
    var year = splitted[0];
    var month = splitted[1];
    var splitday = splitted[2].split("T");
    var day = splitday[0];

    return day + splitter + month + splitter + year;
}


/**
 * Clears leaflet map
 */
function clearMap() {
    for (i in map._layers) {
        if (map._layers[i]._path != undefined) {
            try {
                map.removeLayer(map._layers[i]);
            }
            catch (e) {
                console.log("problem with " + e + map._layers[i]);
            }
        }
    }
}


/**
 * Resets everything
 */
function resetAll() {
    walkingSessions = [];
    runningSessions = [];
    cyclingSessions = [];
    otherSessions = [];

    walkingDistance = 0;
    runningDistance = 0;
    cyclingDistance = 0;
    otherDistance = 0;
    totalDistance = 0;

    types = {};
    walkingSessionCoordinates = [];
    runningSessionCoordinates = [];
    cyclingSessionCoordinates = [];
    otherSessionCoordinates = [];
    otherSports = [];
    firstDate = null;
    lastDate = null;

    walkIndex = 0;
    runIndex = 0;
    cyclingIndex = 0;
    otherIndex = 0;
    totalRoutes = 0;

    document.getElementById("otherRoutes").innerHTML = 0;
    document.getElementById("otherDistance").innerHTML = "0 km"
    document.getElementById("cyclingRoutes").innerHTML = 0;
    document.getElementById("cyclingDistance").innerHTML = "0 km"
    document.getElementById("runningRoutes").innerHTML = 0;
    document.getElementById("runningDistance").innerHTML = "0 km";
    document.getElementById("walkingRoutes").innerHTML = 0;
    document.getElementById("walkingDistance").innerHTML = "0 km";
    document.getElementById("totalDistance").innerHTML = "0 km";
    document.getElementById("totalRoutes").innerHTML = 0;

    document.getElementById("otherSportsList").innerHTML = "";
    document.getElementById("firstDateLabel").innerHTML = "";
    document.getElementById("lastDateLabel").innerHTML = "";
}

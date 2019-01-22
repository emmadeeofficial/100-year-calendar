const daySize = 20;
const vPadding = 2;
const hPadding = 2;
const interBoxPadding = 2;
// period in years
// code doesn't handle period that are not a multiple of the monthBlockSize well
const period = 20;
const monthBlockSize = 10;
const monthsLabels = [{name: "January", maxDays: 31}, {name: "February", maxDays: 29}, {name: "March", maxDays: 31}, {name: "April", maxDays: 30}, {name: "May", maxDays: 31}, {name: "June", maxDays: 30}, {name: "July", maxDays: 31}, {name: "August", maxDays: 31}, {name: "September", maxDays: 30}, {name: "October", maxDays: 31}, {name: "November", maxDays: 30}, {name: "December", maxDays: 31}];


var startTime = Date.now();

var data = new AllYearsData(2002);
//TODO: have a larger object that handles the representation part
var masterDraw = SVG('drawing').size(3000, 3000);
var calendarRepresentation = new CalendarRepresentation(data);
calendarRepresentation.buildRepresentation(masterDraw);

console.log("Execution took " + (Date.now() - startTime) + " ms");

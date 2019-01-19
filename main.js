
var daySize = 20;
var vPadding = 2;
var hPadding = 2;
var interBoxPadding = 2;
// period in years
var period = 100;
const monthsLabels = [{name: "January", maxDays: 31}, {name: "February", maxDays: 29}, {name: "March", maxDays: 31}, {name: "April", maxDays: 30}, {name: "May", maxDays: 31}, {name: "June", maxDays: 30}, {name: "July", maxDays: 31}, {name: "August", maxDays: 31}, {name: "September", maxDays: 30}, {name: "October", maxDays: 31}, {name: "November", maxDays: 30}, {name: "December", maxDays: 31}];
var monthBlockSize = 10;


var draw = SVG('drawing').size(2000, 2000);

var yd = new AllYearsData(2002);
console.log(yd);
//TODO: have a larger object that handles the representation part
var mg = new MonthGroup(monthsLabels[1], yd, draw);
mg.buildRepresentation();
console.log(draw.svg());

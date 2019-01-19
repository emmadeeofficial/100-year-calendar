
var daySize = 20;
var vPadding = 2;
var hPadding = 2;
var interBoxPadding = 2;
// period in years
var period = 100;
var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
var monthBlockSize = 10;


var draw = SVG('drawing').size(2000, 2000);

var yd = new AllYearsData(2002);
console.log(yd);
//TODO: have a larger object that handles the representation part
var monthName = monthNames[1];
var mg = new MonthGroup(monthName, yd, draw);
mg.buildRepresentation();
console.log(draw.svg());

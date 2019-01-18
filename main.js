
var daySize = 20;
var vPadding = 2;
var hPadding = 2;
var interBoxPadding = 2;
class DayBox {
  constructor(draw, x, y, value) {
    this.draw = draw;
    this.x = x;
    this.y = y;
    this.value = value;
  }
  representation(){
    var text = this.draw.text((add) => {
      add.tspan(this.value)
    });
    text.font({
      family:   'Monospace'
      , size:     14
      , anchor:   'middle'
      , align: 'middle'
    });
    text.cx(this.x+((daySize/2)+(text.length()/2)));
    text.cy(this.y+daySize/2)
    //text.attr({ x: (this.x+0.5)*daySize, y: 1.5*daySize });
  }
}
class MonthBox {
  constructor(draw, monthName, maxDays, numDays, y, days){
    this.monthName = monthName;
    this.maxDays = maxDays;
    this.numDays = numDays;
    this.y = y;
    this.days = [];
    this.draw = draw;
    this.nestingParent = draw.nested();
    this.nestingParent.attr({ y : this.y})
  }
}
// period in years
var period = 100;
var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

var monthBlockSize = 10;

class MonthGroup {
  // In the classic On Kawara version of this calendar, months are grouped by decades of a single month in the representation (i.e.: January 1900 -> January 1909)
  // This is done primarily for typesetting purposes. It creates a complexity however: the month's visual representation (as part of a decade) is distinct from its logical representation (as part of a year). This class makes the bridge between the two
  constructor(monthName, dataObj, draw) {
    this.monthName = monthName;
    //fetch all month objects from the data object
    this.monthsData = dataObj.yearsData.map(year => year.monthsData[this.monthName]);
    this.monthBlocks = []; // initially no representation
    this.draw = draw;
  }
  buildRepresentation(){
    console.log("hi");
    // Group months and create respective blocks
    for(let i=0; i<this.monthsData.length; i=i+monthBlockSize){
      let slice = this.monthsData.slice(i, i+monthBlockSize);
      let y = i*(daySize + (2*vPadding));
      this.monthBlocks.push(new MonthBlock(slice, this.draw,y));
    }
  }
}

class MonthBlock {
  // An actual group of {monthBlockSize} months for several years
  constructor(monthsData, draw, y){
    this.monthsData = monthsData;
    this.draw = draw;
    this.y = y;
    //TODO: dynamically determine maxDays either based off of monthsData or based on some statically stored data (probably better that way)
    this.maxDays = 31;
    this.nestingParent = draw.nested();
    this.nestingParent.attr({ y : this.y, x:200});
    this.buildRepresentation();
    this.monthsRepresentation = [];
    this.generateDayBoxes();
  }
  buildRepresentation(){
    let width = (daySize+interBoxPadding)*this.maxDays + (hPadding);
    let height = monthBlockSize*(daySize + (2*vPadding));
    var rect = this.nestingParent.rect(width, height);
    const items = ["blue", "red", "aqua", "lime", "fuchsia", "purple"]
    var color = items[Math.floor(Math.random()*items.length)];
    rect.attr({ fill: color });
    rect.attr({ x: 0, y: 0 });
    rect.back();
  }
  generateDayBoxes() {
    var daysRepresentations = [];
    for(let monthIdx in this.monthsData){
      console.log(monthIdx);
      let daysData = this.monthsData[monthIdx].getDays();
      for(let dayIndex in daysData){
        //TODO USE daysData.value
        let daybox = new DayBox(this.nestingParent, dayIndex*(daySize+interBoxPadding)+hPadding, ((2*vPadding)+daySize)*monthIdx, dayIndex);
        daysRepresentations.push(daybox);
        daybox.representation();
      }
    }
    //this.nestingParent.attr({ x: 23, y: 52 });
  }
}

var draw = SVG('drawing').size(2000, 2000);

var yd = new AllData(2002);
console.log(yd);
//TODO: have a larger object that handles the representation part
var monthName = monthNames[1];
var mg = new MonthGroup(monthName, yd, draw);
mg.buildRepresentation();
console.log(draw.svg());

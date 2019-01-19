class AllYearsData {
  //contains all years
  constructor(startYear) {
    this.startYear = startYear;
    this.yearsData = Array.from(new Array(100), (x,i) => this.startYear+i).map(yearNum => new YearData(yearNum));
  }
  buildRepresentation(draw, x, y) {
    //At the moment, we are not directly representing years
    //TODO: generate year list here OR do it in separate object
    return null;
  }
  draw() {
    //At the moment, we are not directly representing years
    //TODO: generate year list here OR do it in separate object
    return null;
  }
}

class YearData {
  //contains data about a given year
  constructor(yearNum){
    this.yearNum = yearNum;
    this.monthsData = {}
    for (name of monthNames) {
      // store in dict for ease of access when dividing up months in blocks for representation
      this.monthsData[name] = new MonthData(name, this.yearNum);
    }
  }
  buildRepresentation(draw, x, y) {
    //At the moment, we are not directly representing years
    //TODO: generate year list item here
    return null;
  }
  draw() {
    //At the moment, we are not directly representing years
    //TODO: generate year list item here
    return null;
  }
}

class MonthData {
  //contains data about a given month
  constructor(monthName, yearNum) {
    this.monthName = monthName;
    this.yearNum = yearNum;
    this.daysData = Array.from(new Array(31), (x,i) => i).map(dayNum => new DayData(dayNum, this.monthName, this.yearNum));
  }
  buildRepresentation(draw, x, y){
    this.representation = new RepresentationDetails(draw, x, y);
    this.draw();
  }
  draw() {
    for(let dayIndex in this.daysData){
      const x = dayIndex*(daySize+interBoxPadding)+hPadding;
      this.daysData[dayIndex].buildRepresentation(this.representation.canvas, x);
    }
  }
}

class DayData {
  constructor(dayNum, monthName, yearNum) {
    this.dayNum = dayNum;
    this.monthName = monthName;
    this.yearNum = yearNum;
  }
  buildRepresentation(draw, x, y){
    this.representation = new RepresentationDetails(draw, x, y);
    this.draw();
  }
  draw() {
    var text = this.representation.canvas.text((add) => {
      add.tspan(this.dayNum)
    });
    text.font({
      family:   'Monospace'
      , size:     14
      , anchor:   'middle'
      , align: 'middle'
    });
    text.cx((daySize/2)+(text.length()/2));
    text.cy(daySize/2)
  }
}


class MonthGroup {
  // In the classic On Kawara version of this calendar, months are grouped by decades of a single month in the representation (i.e.: January 1900 -> January 1909)
  // This is done primarily for typesetting purposes. It creates a complexity however: the month's visual representation (as part of a decade) is distinct from its logical representation (as part of a year). This class and the MonthBlock class makes the bridge between the two
  constructor(monthName, dataObj, draw) {
    this.monthName = monthName;
    //fetch all month objects from the data object
    this.monthsData = dataObj.yearsData.map(year => year.monthsData[this.monthName]);
    this.monthBlocks = []; // initially no representation
  }
  buildRepresentation(){
    this.representation = new RepresentationDetails(draw, 0, 0);
    this.draw();
  }
  draw() {
    // Group months and create respective blocks
    for(let i=0; i<this.monthsData.length; i=i+monthBlockSize){
      let slice = this.monthsData.slice(i, i+monthBlockSize);
      let y = i*(daySize + (2*vPadding));
      let monthBlock = new MonthBlock(slice);
      monthBlock.buildRepresentation(this.representation.canvas, 0, y);
      //TODO: make sure that everywhere, it's always the parent that controls the canvas' position
      //store all the MonthBlocks associated with a given MonthGroup
      this.monthBlocks.push(monthBlock);
    }
  }
}

class MonthBlock {
  // An actual group of {monthBlockSize} months for several years
  constructor(monthsData, draw){
    this.monthsData = monthsData;
    //TODO: dynamically determine maxDays either based off of monthsData or based on some statically stored data (probably better that way)
    this.maxDays = 31;
  }
  buildRepresentation(draw, x=0, y=0){
    this.representation = new RepresentationDetails(draw, x, y);
    this.draw();
  }
  draw() {
    let width = (daySize+interBoxPadding)*this.maxDays + (hPadding);
    let height = monthBlockSize*(daySize + (2*vPadding));
    var rect = this.representation.canvas.rect(width, height);
    const items = ["blue", "red", "aqua", "lime", "fuchsia", "purple"]
    var color = items[Math.floor(Math.random()*items.length)];
    rect.attr({ fill: color });
    rect.attr({ x: 0, y: 0 });
    rect.back();
    // represent months
    for(let monthIdx in this.monthsData){
      let monthObj = this.monthsData[monthIdx];
      const y = ((2*vPadding)+daySize)*monthIdx;
      monthObj.buildRepresentation(this.representation.canvas, 0, y);
      //here we're not storing the representation of a given month as it's already stored in the data object
    }
  }
}

class RepresentationDetails {
  // handles drawing canvas creation and positioning to enable components to draw without having to take into account their positioning in space
  constructor(draw, x=0, y=0) {
    this.x = x;
    this.y = y;
    this.canvas = draw.nested();
    // Position canvas
    this.canvas.attr({ x: x, y: y});
  }
}

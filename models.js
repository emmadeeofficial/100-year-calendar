class AllYearsData {
  //contains all years
  constructor(startYear) {
    this.startYear = startYear;
    this.yearsData = Array.from(new Array(period), (x,i) => this.startYear+i).map(yearNum => new YearData(yearNum));
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
    for (let month = 0; month < monthsLabels.length; month++) {
      console.log(typeof month);
      // store in dict for ease of access when dividing up months in blocks for representation
      this.monthsData[monthsLabels[month].name] = new MonthData(this.yearNum, month+1, monthsLabels[month].name, monthsLabels[month].maxDays);
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
  constructor(yearNum, monthNum, monthName, maxDays) {
    this.monthName = monthName;
    this.maxDays = maxDays;
    //TODO: determine whether we actually need both the name/maxdays and monthNum or if we could instead just have the index and fetch the rest from the const with all month labels
    this.monthNum = monthNum;
    this.yearNum = yearNum;
    // we use a moment.js abstraction to directly generate the right number of DayData object, instead of having the 29th day of february having to hide itself on non leap year. Moreover, we decrease the "human" month num by one as moment.js indexes month starting at 0
    const numDays = moment().month(this.monthNum-1).year(yearNum).daysInMonth();
    console.log(this.monthNum);
    this.daysData = Array.from(new Array(numDays), (x,i) => i+1).map(dayNum => new DayData(this.yearNum, this.monthNum, dayNum));
  }
  buildRepresentation(draw, x, y){
    this.representation = new RepresentationDetails(draw, x, y);
    this.draw();
  }
  draw() {
    //draw a container rectangle for outlining
    //TODO: the width and height are repeated for the monthblock. find a way to not repeat yourself
    let width = (daySize+interBoxPadding)*this.maxDays + (hPadding);
    let height = (daySize + (2*vPadding));
    var rect = this.representation.canvas.rect(width, height);
    rect.fill({ opacity: 0 });
    rect.attr({ x: 0, y: 0 });
    rect.attr({ stroke: '#000', 'stroke-width': 1});
    rect.back();
    for(let dayIndex in this.daysData){
      const x = dayIndex*(daySize+interBoxPadding)+hPadding;
      this.daysData[dayIndex].buildRepresentation(this.representation.canvas, x);
    }
  }
}

class DayData {
  constructor(yearNum, monthNum, dayNum) {
    this.yearNum = yearNum;
    this.monthNum = monthNum;
    this.dayNum = dayNum;
    // using moment.js, day of month is a number from 1 to 31
    // calculating this for each day using moment.js is slight overkill, but it only affects the performance marginally, so we're doing it for ease of code maintenance. In theory, we could call the day() function on the first day of the sequence and determine the sundays that way, but that logic would have to be moved to the year, if not the general data container. We find the current solution easier to read.
    this.isSunday = moment().month(this.monthNum-1).date(this.dayNum).year(yearNum).day() == 0;
  }
  buildRepresentation(draw, x, y){
    this.representation = new RepresentationDetails(draw, x, y);
    this.draw();
  }
  draw() {
    var text = this.representation.canvas.text((add) => {
      add.tspan(this.isSunday ? 'X' : this.dayNum)
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
  constructor(monthLabel, dataObj, draw) {
    this.monthName = monthLabel.name;
    this.maxDays = monthLabel.maxDays;
    //fetch all month objects from the data object
    //TODO: have monthsData refer to the index in the monthLabels consnt?
    this.monthsData = dataObj.yearsData.map(year => year.monthsData[this.monthName]);
    this.monthBlocks = []; // initially no representation
  }
  buildRepresentation(draw, x, y){
    this.representation = new RepresentationDetails(draw, x, y);
    this.draw();
  }
  draw() {
    // Group months and create respective blocks
    for(let i=0; i<period; i=i+monthBlockSize){
      let slice = this.monthsData.slice(i, i+monthBlockSize);
      let y = i*(daySize + (2*vPadding));
      let monthBlock = new MonthBlock(slice, this.maxDays);
      monthBlock.buildRepresentation(this.representation.canvas, 0, y);
      //TODO: make sure that everywhere, it's always the parent that controls the canvas' position
      //store all the MonthBlocks associated with a given MonthGroup
      this.monthBlocks.push(monthBlock);
    }
  }
}

class MonthBlock {
  // An actual group of {monthBlockSize} months for several years
  constructor(monthsData, maxDays){
    this.monthsData = monthsData;
    //TODO: dynamically determine maxDays either based off of monthsData or based on some statically stored data (probably better that way)
    this.maxDays = maxDays;
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
    rect.attr({ stroke: '#000', 'stroke-width': 2});
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

class CalendarRepresentation {
  constructor(data) {
    this.data = data;
  }
  buildRepresentation(draw, x=0, y=0){
    this.representation = new RepresentationDetails(draw, x, y);
    this.draw();
  }
  draw() {
    var offset = 0;
    //draw months
    //for (let i=0; i<monthsLabels.length; i++) {
    for (let i=0; i<2; i++) {
      //TODO is it really necessary to pass the whole data object? seems like it but double check
      var mg = new MonthGroup(monthsLabels[i], this.data, this.representation.canvas);
      console.log(monthsLabels[i]);
      console.log(offset);
      mg.buildRepresentation(this.representation.canvas, offset, 0);
      offset += (hPadding + (mg.maxDays*(daySize+interBoxPadding)));
    }
  }
}

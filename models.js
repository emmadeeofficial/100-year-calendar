class HasRepresentation {
  // Parent class for all objects that have a representation in the SVG document
  constructor() {
  }
  buildRepresentation(draw, x=0, y=0){
    // We initialize representations here rather than in the constructor as the draw argument is not necessarily available when the object is first created.
    this.x = x;
    this.y = y;
    this.representation = draw.nested();
    // Position nested container
    this.representation.attr({ x: x, y: y});
    this.draw();
  }
  static styleText(text, textSize) {
    text.font({
      family:   'Source Sans Pro'
      , size:     textSize
      , anchor:   'middle'
      , align: 'middle'
    });
  }
}

class AllYearsData extends HasRepresentation {
  //contains all years
  constructor(startYear) {
    super();
    this.startYear = startYear;
    this.yearsData = Array.from(new Array(period), (x,i) => this.startYear+i).map(yearNum => new YearData(yearNum));
  }
  draw() {
    var yOffset = 0;
    for (let i=0; i<this.yearsData.length; i++) {
      this.yearsData[i].buildRepresentation(this.representation, 0, yOffset)
      yOffset += (daySize + (2*vPadding));
    }
  }
}

class YearData extends HasRepresentation {
  //contains data about a given year
  constructor(yearNum){
    super();
    this.yearNum = yearNum;
    this.monthsData = {}
    for (let month = 0; month < monthsLabels.length; month++) {
      console.log(typeof month);
      // store in dict for ease of access when dividing up months in blocks for representation
      // The +1 serves to keep MonthData constructor style consistent with Year and Date that are both represented in human-friendyly form (so starting at 1)
      this.monthsData[monthsLabels[month].name] = new MonthData(this.yearNum, month+1);
    }
  }
  draw() {
    let width = 2*(hPadding+daySize);
    let height = (daySize + (2*vPadding));
    var rect = this.representation.rect(width, height);
    rect.fill({ opacity: 0 });
    rect.attr({ x: 0, y: 0 });
    rect.attr({ stroke: '#000', 'stroke-width': 1});
    rect.back();

    var text = this.representation.text(this.yearNum.toString());
    HasRepresentation.styleText(text, textSize);
    text.cx(Math.floor((width/2)+(text.length()/2)));
    text.cy((daySize/2)+(vPadding/2))
  }
}

class MonthData extends HasRepresentation {
  //contains data about a given month
  constructor(yearNum, monthNum) {
    super();
    this.monthName = monthsLabels[monthNum-1].monthName;
    //maxDays determines the max possible number of days in a certain month, not whether the one we're dealing with actually has this max (think of February). Having a property explicitely defined in this object allows for cleaner / easier to read code.
    this.maxDays = monthsLabels[monthNum-1].maxDays;
    this.monthNum = monthNum;
    this.yearNum = yearNum;
    var numDays = this.maxDays
    if(this.monthNum == 2){
      // we use a moment.js abstraction to obtain the actual number of days of the month and directly generate the right number of DayData object, instead of having the 29th day of february having to hide itself on non leap year. Moreover, we decrease the "human" month num by one as moment.js indexes month starting at 0
      numDays = moment().month(this.monthNum-1).year(yearNum).daysInMonth();
    }
    this.daysData = Array.from(new Array(numDays), (x,i) => i+1).map(dayNum => new DayData(this.yearNum, this.monthNum, dayNum));
  }
  draw() {
    //draw a container rectangle for outlining
    let width = (daySize+interBoxPadding)*this.maxDays + (2*hPadding);
    let height = (daySize + (2*vPadding));
    var rect = this.representation.rect(width, height);
    rect.fill({ opacity: 0 });
    rect.attr({ x: 0, y: 0 });
    rect.attr({ stroke: '#000', 'stroke-width': 1});
    rect.back();
    for(let dayIndex in this.daysData){
      const x = dayIndex*(daySize+interBoxPadding)+hPadding;
      this.daysData[dayIndex].buildRepresentation(this.representation, x);
    }
  }
}

class DayData extends HasRepresentation {
  constructor(yearNum, monthNum, dayNum) {
    super();
    this.yearNum = yearNum;
    this.monthNum = monthNum;
    this.dayNum = dayNum;
    // using moment.js, day of month is a number from 1 to 31
    // calculating this for each day using moment.js is slight overkill, but it only affects the performance marginally, so we're doing it for ease of code maintenance. In theory, we could call the day() function on the first day of the sequence and determine the sundays that way, but that logic would have to be moved to the year, if not the general data container. We find the current solution easier to read.
    this.isSunday = moment().month(this.monthNum-1).date(this.dayNum).year(yearNum).day() == 0;
  }
  draw() {
    this.drawText();
    this.drawShapes();
  }
  drawText() {
    var text = this.representation.text(this.dayNum.toString());
    HasRepresentation.styleText(text, textSize);
    text.cx((daySize/2)+(text.length()/2));
    text.cy((daySize/2)+(vPadding-1));
  }
  drawShapes() {
    if(this.isSunday){
      var circle = this.representation.circle("20px");
      circle.fill({color: '#DEDEDE'});
      circle.cx(daySize/2);
      circle.cy((daySize/2)+(vPadding));
      circle.back();
    }
  }
}


class DataGroup extends HasRepresentation {
  // In the classic On Kawara version of this calendar, months are grouped by decades of a single month in the representation (i.e.: January 1900 -> January 1909)
  // This is done primarily for typesetting purposes. It creates a complexity however: the month's visual representation (as part of a decade) is distinct from its logical representation (as part of a year). This class and its child classes makes the bridge between the two
  constructor(data, blockType) {
    super();
    //fetch all year objects from the data object
    this.data = data;
    this.blocks = []; // initially no representation
    this.blockType = blockType;
  }
  draw() {
    // Group year and create respective blocks
    for(let i=0; i<period; i=i+monthBlockSize){
      let slice = this.data.slice(i, i+monthBlockSize);
      let y = i*(daySize + (2*vPadding));
      //TODO: instead of "22", we should have the exact value computed. -- will be fixed when refactoring grid system
      let block = new this.blockType(slice, (this.maxDays ? this.maxDays : 25));
      block.buildRepresentation(this.representation, 0, y);
      //store all the MonthBlocks associated with a given MonthGroup
      this.blocks.push(block);
    }
  }
}


class MonthGroup extends DataGroup {
  constructor(monthLabel, dataObj) {
  //fetch all month objects from the data object
    var data = dataObj.yearsData.map(year => year.monthsData[monthLabel.name]);
    super(data, MonthBlock);
    this.monthName = monthLabel.name;
    this.maxDays = monthLabel.maxDays;
  }
}

class YearGroup extends DataGroup {
  // Equivalent of MonthGroup for year labels
  constructor(dataObj) {
    super(dataObj.yearsData, YearBlock);
    this.width = 4;
  }
}

class DataBlock extends HasRepresentation {
  // An actual group of {monthBlockSize} months for several years
  constructor(data, width){
    super();
    this.data = data;
    //TODO: dynamically determine width either based off of monthsData or based on some statically stored data (probably better that way)
    this.width = width;
  }
  draw() {
    let width = (daySize+interBoxPadding)*this.width + (2*hPadding);
    let height = monthBlockSize*(daySize + (2*vPadding));
    var rect = this.representation.rect(width, height);
    //TODO: maybe leave colors as an easter egg? :)
    //const items = ["blue", "red", "aqua", "lime", "fuchsia", "purple"]
    //var color = items[Math.floor(Math.random()*items.length)];
    //rect.attr({ fill: color });
    rect.attr({ fill: 'white' });
    rect.attr({ x: 0, y: 0 });
    rect.attr({ stroke: '#000', 'stroke-width': 2});
    rect.front();
    // represent months
    for(let idx in this.data){
      let dataObj = this.data[idx];
      const y = ((2*vPadding)+daySize)*idx;
      dataObj.buildRepresentation(this.representation, 0, y);
      //here we're not storing the representation of a given month as it's already stored in the data object
    }
  }
}

class MonthBlock extends DataBlock {
  // An actual group of {monthBlockSize} months for several years
  constructor(data, width){
    super(data, width);
  }
}

class YearBlock extends DataBlock {
  // An actual group of {monthBlockSize} months for several years
  constructor(data, width){
    super(data, width);
  }
}

class CalendarRepresentation extends HasRepresentation {
  constructor(data, xOffset, yOffset) {
    super();
    this.data = data;
    this.xOffset = xOffset;
    this.yOffset = yOffset;
  }
  draw() {
    //hacky use of calendarBorderThickness to accomodate the fact that svg draws border partially inside the element on which the border is drawn
    var currentXOffset = this.xOffset + calendarBorderThickness*1.5;
    var yOffset = this.yOffset + textSize*3 + calendarBorderThickness*1.5;
    this.drawYearList(currentXOffset, yOffset);
    var yearListWidth = 2*(hPadding+daySize);
    currentXOffset += yearListWidth;
    currentXOffset = this.drawMonthGroups(currentXOffset, yOffset);
    this.drawCalendarBorder(this.xOffset, this.yOffset + textSize*3, currentXOffset-this.xOffset);
  }
  drawYearList(xOffset, yOffset){
    var yg = new YearGroup(this.data);
    yg.buildRepresentation(this.representation, xOffset, yOffset);
  }
  drawMonthLabels(xOffset, yOffset, maxDays, monthName){
    var text = this.representation.text(monthName);
    HasRepresentation.styleText(text, textSize*0.8);
    text.cx(((maxDays*(daySize+interBoxPadding)+2*hPadding)/2 + xOffset)
    + (text.length()/2));
    text.cy(45)
  }
  drawMonthGroups(xOffset, yOffset) {
    //draw months
    for (let i=0; i<monthsLabels.length; i++) {
      var mg = new MonthGroup(monthsLabels[i], this.data);
      mg.buildRepresentation(this.representation, xOffset, yOffset);
      this.drawMonthLabels(xOffset, yOffset, mg.maxDays, mg.monthName);
      xOffset += (2*hPadding + (mg.maxDays*(daySize+interBoxPadding)));
    }
    return xOffset;
  }
  drawCalendarBorder(xOffset, yOffset, widthOffset) {
    // draw bounding box
    let width = widthOffset-0.5*calendarBorderThickness;
    let height = (period*(daySize + (2*vPadding))+calendarBorderThickness);
    var rect = this.representation.rect(width, height);
    rect.fill({ opacity: 0 });
    rect.attr({ x: xOffset+calendarBorderThickness, y: yOffset+calendarBorderThickness });
    rect.attr({ stroke: '#000', 'stroke-width': calendarBorderThickness});
    rect.front();
  }
}

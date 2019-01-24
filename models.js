//TODO check if class inheritance is the right thing to do here, and if so, implement, otherwise delete
class HasRepresentation {
  constructor() {
  }
  buildRepresentation(draw, x=0, y=0){
    this.representation = new RepresentationDetails(draw, x, y);
    this.draw();
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
      this.yearsData[i].buildRepresentation(this.representation.canvas, 0, yOffset)
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
      this.monthsData[monthsLabels[month].name] = new MonthData(this.yearNum, month+1, monthsLabels[month].name, monthsLabels[month].maxDays);
    }
  }
  draw() {
    let width = 2*(hPadding+daySize);
    let height = (daySize + (2*vPadding));
    var rect = this.representation.canvas.rect(width, height);
    rect.fill({ opacity: 0 });
    rect.attr({ x: 0, y: 0 });
    rect.attr({ stroke: '#000', 'stroke-width': 1});
    rect.back();

    var text = this.representation.canvas.text(String(this.yearNum));
    text.font({
      family:   'Monospace'
      , size:     14
      , anchor:   'middle'
      , align: 'middle'
    });
    text.cx(Math.floor((width/2)+(text.length()/2)));
    text.cy((daySize/2)+(vPadding/2))
  }
}

class MonthData extends HasRepresentation {
  //contains data about a given month
  constructor(yearNum, monthNum, monthName, maxDays) {
    super();
    this.monthName = monthName;
    //maxDays determines the max possible number of days in a certain month, not whether the one we're dealing with actually has this max (think of February)
    this.maxDays = maxDays;
    //TODO: determine whether we actually need both the name/maxdays and monthNum or if we could instead just have the index and fetch the rest from the const with all month labels
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
    //TODO: the width and height are repeated for the monthblock. find a way to not repeat yourself
    let width = (daySize+interBoxPadding)*this.maxDays + (2*hPadding);
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
    // TODO: make this modulable/configurable
    const value = this.isSunday ? '•' : this.dayNum;
    var text = this.representation.canvas.text((add) => {
      add.tspan(value)
    });
    text.font({
      family:   'Monospace'
      , size:     14
      , anchor:   'middle'
      , align: 'middle'
    });
    text.cx((daySize/2)+(text.length()/2));
    text.cy((daySize/2)+(vPadding/2))
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
      //TODO: instead of "22", we should have the exact value computed.
      let block = new this.blockType(slice, (this.maxDays ? this.maxDays : 22));
      block.buildRepresentation(this.representation.canvas, 0, y);
      //TODO: make sure that everywhere, it's always the parent that controls the canvas' position
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
    //TODO: have monthsData refer to the index in the monthLabels consnt?
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
    var rect = this.representation.canvas.rect(width, height);
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
      dataObj.buildRepresentation(this.representation.canvas, 0, y);
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

class CalendarRepresentation extends HasRepresentation {
  constructor(data, xOffset, yOffset) {
    super();
    this.data = data;
    this.xOffset = xOffset;
    this.yOffset = yOffset;
  }
  draw() {
    //hacky use of calendarBorderThickness to accomodate the fact that svg draws border partially inside the element on which the border is drawn
    //TODO: fix confusing variable names here
    var xOffset = this.xOffset + calendarBorderThickness*1.5;
    //TODO: change this hard coded "40" that allows for month labels into something cleaner
    var yOffset = this.yOffset + 40 + calendarBorderThickness*1.5;
    //width of calendar is calculated as result of drawing drawMonthgroups
    //TODO: SINCE MAXDAYS IS A CONSTANT, THIS SHOULD BE DONE WITHOUT HAVING TO RETURN VALUE FROM drawMonthGroups
    this.drawYearList(xOffset, yOffset);
    var yearListWidth = 2*(hPadding+daySize);
    xOffset += yearListWidth;
    xOffset = this.drawMonthGroups(xOffset, yOffset);
    // TODO: cleanup var names. the use of this.xOffset and xOffset is confusing
    this.drawCalendarBorder(this.xOffset, this.yOffset + 40, xOffset-this.xOffset);
  }
  drawYearList(xOffset, yOffset){
    //TODO: this is ambiguous. Is data all the data or just the years? find way to make this more maintainable
    //this.data.buildRepresentation(this.representation.canvas, xOffset, yOffset);
    var yg = new YearGroup(this.data);
    yg.buildRepresentation(this.representation.canvas, xOffset, yOffset);
  }
  drawMonthLabels(xOffset, yOffset, maxDays, monthName){
    var text = this.representation.canvas.text(monthName);
    //TODO: move all those font definitions in a single method?
    text.font({
      family:   'Source Sans Pro'
      , size:     12
      , anchor:   'middle'
      , align: 'middle'
    });
    text.cx(((maxDays*(daySize+interBoxPadding)+2*hPadding)/2 + xOffset)
    + (text.length()/2));
    text.cy(45)
  }
  drawMonthGroups(xOffset, yOffset) {
    //draw months
    for (let i=0; i<monthsLabels.length; i++) {
    //for (let i=0; i<2; i++) {
      //TODO is it really necessary to pass the whole data object? seems like it but double check
      var mg = new MonthGroup(monthsLabels[i], this.data);
      mg.buildRepresentation(this.representation.canvas, xOffset, yOffset);
      this.drawMonthLabels(xOffset, yOffset, mg.maxDays, mg.monthName);
      xOffset += (2*hPadding + (mg.maxDays*(daySize+interBoxPadding)));
    }
    return xOffset;
  }
  drawCalendarBorder(xOffset, yOffset, widthOffset) {
    // draw bounding box
    let width = widthOffset-0.5*calendarBorderThickness;
    let height = (period*(daySize + (2*vPadding))+calendarBorderThickness);
    var rect = this.representation.canvas.rect(width, height);
    rect.fill({ opacity: 0 });
    rect.attr({ x: xOffset+calendarBorderThickness, y: yOffset+calendarBorderThickness });
    rect.attr({ stroke: '#000', 'stroke-width': calendarBorderThickness});
    rect.front();
  }
}

class HasRepresentation {
  // Parent class for all objects that have a representation in the SVG document
  constructor() {
    // initialize properties as undefined here for clarity
    this.x = undefined;
    this.y = undefined;
    this.representation = undefined;
  }
  buildRepresentation(draw, x=0, y=0){
    // We initialize representations here rather than in the constructor as the draw argument (designating the SVG parent) is not necessarily available when the object is first created.
    this.x = x;
    this.y = y;
    this.representation = draw.nested();
    // Position nested container
    this.representation.attr({ x: this.x, y: this.y});
    return this.draw();
  }
  static styleText(text, textSize) {
    text.font({
      family: 'Source Sans Pro',
      size: textSize,
      anchor: 'middle',
      align: 'middle'
    });
  }
}

class AllData extends HasRepresentation {
  constructor(startYear) {
    super();
    this.startYear = startYear;
    this.yearsData = Array.from(new Array(config.period), (x,i) => this.startYear+i).map(yearNum => new YearData(yearNum));
  }
  draw() {
    let yOffset = 0;
    for (let i=0; i<this.yearsData.length; i++) {
      this.yearsData[i].buildRepresentation(this.representation, 0, yOffset)
      yOffset += (config.daySize + (2*config.vPadding));
    }
  }
}

class YearData extends HasRepresentation {
  constructor(yearNum){
    super();
    this.yearNum = yearNum;
    this.monthsData = {};
    for (let month = 0; month < config.monthsLabels.length; month++) {
      // store in dict for ease of access when dividing up months in blocks for representation
      // The +1 serves to keep MonthData constructor style consistent with Year and Date that are both represented in human-friendyly form (so starting at 1)
      this.monthsData[config.monthsLabels[month].name] = new MonthData(this.yearNum, month+1);
    }
  }
  draw() {
    let cellWidth = config.yearCellWidth;
    let cellHeight = (config.daySize + (2*config.vPadding));
    this.drawText(cellWidth);
    this.drawShapes(cellWidth, cellHeight);
  }
  drawText(cellWidth) {
    let yearNumString = this.yearNum.toString();
    let text = this.representation.text(yearNumString);
    HasRepresentation.styleText(text, config.textSize);
    text.cx(Math.floor((cellWidth/2)+(text.length()/2)));
    text.cy((config.daySize+config.vPadding)/2)
  }
  drawShapes(cellWidth, cellHeight) {
    let rect = this.representation.rect(cellWidth, cellHeight);
    rect.fill({ opacity: 0 });
    rect.attr({ x: 0, y: 0 });
    rect.attr({ stroke: '#000', 'stroke-width': 1});
    rect.back();
  }
}

class MonthData extends HasRepresentation {
  //contains data about a given month
  constructor(yearNum, monthNum) {
    super();
    let monthIndex = monthNum - 1;
    let monthLabel = config.monthsLabels[monthIndex];
    let numDays;
    this.monthName = monthLabel.monthName;
    //maxDays determines the max possible number of days in a certain month, not whether the one we're dealing with actually has this max (think of February). Having a property explicitely defined in this object allows for cleaner / easier to read code.
    this.maxDays = monthLabel.maxDays;
    this.monthNum = monthNum;
    this.yearNum = yearNum;
    numDays = this.maxDays
    if(this.monthNum == 2){
      // we use a moment.js abstraction to obtain the actual number of days of the month and directly generate the right number of DayData object, instead of having the 29th day of february having to hide itself on non leap year. Moreover, we decrease the "human" month num by one as moment.js indexes month starting at 0
      numDays = moment().month(monthIndex).year(yearNum).daysInMonth();
    }
    this.daysData = Array.from(new Array(numDays), (x,i) => i+1).map(dayNum => new DayData(this.yearNum, this.monthNum, dayNum));
  }
  draw() {
    this.drawShapes();
    this.drawDays();
  }
  drawShapes() {
    //draw a container rectangle for outlining
    let width = (config.daySize)*this.maxDays + config.interBoxPadding*(this.maxDays-1) + (2*config.hPadding);
    let height = config.daySize + (2*config.vPadding);
    let rect = this.representation.rect(width, height);
    rect.fill({ opacity: 0 });
    rect.attr({ x: 0, y: 0 });
    rect.attr({ stroke: '#000', 'stroke-width': 1});
    rect.back();
  }
  drawDays() {
    let xOffset = config.hPadding;
    for(let i=0; i<this.daysData.length; i++){
      this.daysData[i].buildRepresentation(this.representation, xOffset);
      // no need to adjust for last day's config.interBoxPadding here, since, well, it's the last
      xOffset += config.daySize + config.interBoxPadding;
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
    let dayNumString = this.dayNum.toString();
    let text = this.representation.text(dayNumString);
    HasRepresentation.styleText(text, config.textSize);
    text.cx((config.daySize+text.length())/2);
    text.cy((config.daySize/2)+(config.vPadding-1));
  }
  drawShapes() {
    if(this.isSunday){
      let circle = this.representation.circle(config.textSize*1.4);
      circle.fill({color: '#DEDEDE'});
      circle.cx(config.daySize/2);
      circle.cy((config.daySize/2)+(config.vPadding));
      circle.back();
    }
  }
}


class DataGroup extends HasRepresentation {
  // In the classic On Kawara version of this calendar, months are grouped by decades of a single month in the representation (i.e.: January 1900 -> January 1909)
  // This is done primarily for typesetting purposes. It creates a complexity however: the month's visual representation (as part of a decade) is distinct from its logical representation (as part of a year). This class and its child classes makes the bridge between the two
  constructor(data, width) {
    super();
    this.data = data;
    this.width = width;
    this.blocks = [];
  }
  draw() {
    // Group year and create respective blocks
    let y = 0;
    for(let i=0; i*config.monthBlockSize<config.period; i++){
      let slice = this.data.slice(i*config.monthBlockSize, (i+1)*config.monthBlockSize);
      //TODO: instead of "25", we should have the exact value computed. -- will be fixed when refactoring grid system
      let block = new DataBlock(slice, this.width);
      block.buildRepresentation(this.representation, 0, y);
      //store all the MonthBlocks associated with a given MonthGroup
      this.blocks.push(block);
      // TODO: fix ? Repeat of height calculation below
      y += config.monthBlockSize*(config.daySize + (2*config.vPadding))+config.innerGridThickness;
    }
  }
}

class DataBlock extends HasRepresentation {
  // An actual group of {config.monthBlockSize} months or years for several years
  constructor(data, width, hasGrid){
    super();
    this.data = data;
    //TODO: dynamically determine width either based off of monthsData or based on some statically stored data (probably better that way)
    console.log(this.width);
    this.width = width;
  }
  draw() {
    this.drawGrid();
    // represent items
    let y = config.innerGridThickness/2;
    let x = config.innerGridThickness/2;
    for(let i=0; i<this.data.length; i++){
      this.data[i].buildRepresentation(this.representation, x, y);
      y += ((2*config.vPadding)+config.daySize);
    }
  }
  drawGrid() {
    let height = config.monthBlockSize*(config.daySize + (2*config.vPadding))+config.innerGridThickness;
    let width = this.width;
    let rect = this.representation.rect(width, height);
    //TODO: maybe leave colors as an easter egg? :)
    //const items = ["blue", "red", "aqua", "lime", "fuchsia", "purple"]
    //let color = items[Math.floor(Math.random()*items.length)];
    //rect.attr({ fill: color });
    rect.attr({ fill: 'white' });
    rect.attr({ x: 0, y: 0 });
    rect.attr({ stroke: '#000', 'stroke-width': config.innerGridThickness});
    rect.front();
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
    //hacky use of config.calendarBorderThickness to accommodate the fact that svg draws border partially inside the element on which the border is drawn
    //TODO clean up this code
    let drawingxOffset = this.xOffset + config.calendarBorderThickness*1.5;
    let drawingyOffset = this.yOffset + config.textSize*3 + config.calendarBorderThickness*1.5;
    this.drawYearList(drawingxOffset, drawingyOffset);
    let yearListWidth = config.yearCellWidth + config.innerGridThickness;
    drawingxOffset += yearListWidth;
    drawingxOffset = this.drawMonthGroups(drawingxOffset, drawingyOffset);
    console.log(drawingyOffset);
    //TODO: cleanup this currentYOffset thing
    let currentYOffset = this.drawCalendarBorder(this.xOffset, this.yOffset + config.textSize*3, drawingxOffset-this.xOffset) + 2*drawingyOffset;
    return {y: currentYOffset, x: drawingxOffset + this.xOffset + config.calendarBorderThickness*1.5}
  }
  drawYearList(xOffset, yOffset){
    //TODO fix all these repeated width, like config.yearCellWidth
    let width = config.yearCellWidth + config.innerGridThickness;
    //txt
    let yg = new DataGroup(this.data.yearsData, width);
    yg.buildRepresentation(this.representation, xOffset, yOffset);
  }
  drawMonthLabels(xOffset, yOffset, maxDays, monthName){
    let text = this.representation.text(monthName);
    HasRepresentation.styleText(text, config.textSize*0.8);
    text.cx((((maxDays*config.daySize) + ((maxDays-1) * config.interBoxPadding)+2*config.hPadding)/2 + xOffset)
    + (text.length()/2));
    text.cy(45)
  }
  drawMonthGroups(xOffset, yOffset) {
    //draw months
    for (let i=0; i<config.monthsLabels.length; i++) {
      let monthLabel = config.monthsLabels[i];
      let data = this.data.yearsData.map(year => year.monthsData[monthLabel.name]);
      let width = (config.daySize*monthLabel.maxDays) + (config.interBoxPadding*(monthLabel.maxDays-1)) + (2*config.hPadding) + (config.innerGridThickness);
      let mg = new DataGroup(data, width);
      mg.buildRepresentation(this.representation, xOffset, yOffset);
      this.drawMonthLabels(xOffset, yOffset, monthLabel.maxDays, monthLabel.name);
      xOffset += width;
    }
    return xOffset;
  }
  drawCalendarBorder(xOffset, yOffset, width) {
    // draw bounding box
    let height = (config.period*(config.daySize + (2*config.vPadding))+config.calendarBorderThickness);
    width -= 0.5*config.calendarBorderThickness;
    let rect = this.representation.rect(width, height);
    rect.fill({ opacity: 0 });
    rect.attr({ x: xOffset+config.calendarBorderThickness, y: yOffset+config.calendarBorderThickness });
    rect.attr({ stroke: '#000', 'stroke-width': config.calendarBorderThickness});
    rect.front();
    return height;
  }
}

function generateCalendar(startYear) {
  let startTime = Date.now();
  let data = new AllData(startYear);
  //TODO: generate canvas size dynamically
  let masterDraw = SVG('drawing').size(1, 1);
  let calendarRepresentation = new CalendarRepresentation(data, xOffset=30, yOffset=20);
  let {x, y} = calendarRepresentation.buildRepresentation(masterDraw);
  masterDraw.size(x, y);
  console.log("Execution took " + (Date.now() - startTime) + " ms");
  //console.log(masterDraw.svg())
}

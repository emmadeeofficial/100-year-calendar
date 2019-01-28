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
    this.yearsData = Array.from(new Array(config.data.period), (x,i) => this.startYear+i).map(yearNum => new YearData(yearNum));
  }
}

class YearData extends HasRepresentation {
  constructor(yearNum){
    super();
    this.yearNum = yearNum;
    this.monthsData = {};
    for (let month = 0; month < config.data.monthsLabels.length; month++) {
      // store in dict for ease of access when dividing up months in blocks for representation
      // The +1 serves to keep MonthData constructor style consistent with Year and Date that are both represented in human-friendyly form (so starting at 1)
      this.monthsData[config.data.monthsLabels[month].name] = new MonthData(this.yearNum, month+1);
    }
  }
  draw() {
    this.drawText();
    this.drawShapes();
  }
  drawText() {
    let yearNumString = this.yearNum.toString();
    let text = this.representation.text(yearNumString);
    HasRepresentation.styleText(text, config.styling.textSize);
    text.x(config.styling.yearCellWidth/2)
    //  - 1 is hacky adjustment
    text.cy((config.styling.cellHeight/2) - 1);
  }
  drawShapes() {
    let rect = this.representation.rect(config.styling.yearCellWidth, config.styling.cellHeight);
    rect.fill({ opacity: 0 });
    rect.attr({ stroke: '#000', 'stroke-width': config.styling.innerCellBorderThickness});
  }
}

class MonthData extends HasRepresentation {
  //contains data about a given month
  constructor(yearNum, monthNum) {
    super();
    let monthIndex = monthNum - 1;
    let monthLabel = config.data.monthsLabels[monthIndex];
    let numDays;
    this.monthName = monthLabel.monthName;
    //maxDays determines the max possible number of days in a certain month, not whether the one we're dealing with actually has this max (think of February). Having a property explicitely defined in this object allows for cleaner / easier to read code.
    this.maxDays = monthLabel.maxDays;
    this.monthNum = monthNum;
    this.yearNum = yearNum;
    numDays = this.maxDays;
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
    let width = (config.styling.daySize * this.maxDays ) + (config.styling.interBoxPadding * ( this.maxDays - 1)) + (2 * config.styling.hPadding);
    let rect = this.representation.rect(width, config.styling.cellHeight);
    rect.fill({ opacity: 0 });
    rect.attr({ stroke: '#000', 'stroke-width': config.styling.innerCellBorderThickness});
  }
  drawDays() {
    let xOffset = config.styling.hPadding;
    for(let i=0; i<this.daysData.length; i++){
      this.daysData[i].buildRepresentation(this.representation, xOffset);
      // no need to adjust for last day's config.styling.interBoxPadding here, since, well, it's the last
      xOffset += config.styling.daySize + config.styling.interBoxPadding;
      // we could return the xOffset and draw the shape based on it but that seems like overcomplicating things -- the width calculation above is O(1) anyway
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
    HasRepresentation.styleText(text, config.styling.textSize);
    text.x(config.styling.daySize/2)
    //  - 1 is hacky adjustment
    text.cy((config.styling.cellHeight/2) - 1);
  }
  drawShapes() {
    if(this.isSunday){
      let circle = this.representation.circle(config.styling.textSize*1.4);
      circle.fill({color: '#DEDEDE'});
      circle.cx(config.styling.daySize/2);
      circle.cy(config.styling.cellHeight/2);
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
    const blockHeight = config.styling.monthBlockSize*(config.styling.cellHeight)+config.styling.innerGridBorderThickness;
    for(let i=0; i*config.styling.monthBlockSize<config.data.period; i++){
      let slice = this.data.slice(i*config.styling.monthBlockSize, (i+1)*config.styling.monthBlockSize);
      let block = new DataBlock(slice, this.width, blockHeight);
      block.buildRepresentation(this.representation, 0, y);
      this.blocks.push(block);
      y += blockHeight;
    }
  }
}

class DataBlock extends HasRepresentation {
  constructor(data, width, height){
    super();
    this.data = data;
    this.width = width;
    this.height = height;
  }
  draw() {
    this.drawGrid();
    this.drawItems();
  }
  drawGrid() {
    let rect = this.representation.rect(this.width, this.height);
    rect.attr({ fill: 'white' });
    // Hi! This is a lot of fun. Try it.
    /*const items = ["blue", "red", "aqua", "lime", "fuchsia", "purple"]
    let color = items[Math.floor(Math.random()*items.length)];
    rect.attr({ fill: color });*/
    rect.attr({ stroke: '#000', 'stroke-width': config.styling.innerGridBorderThickness});
  }
  drawItems() {
    // represent items
    let y = config.styling.innerGridBorderThickness/2;
    let x = config.styling.innerGridBorderThickness/2;
    for(let i=0; i<this.data.length; i++){
      this.data[i].buildRepresentation(this.representation, x, y);
      y += (config.styling.cellHeight);
    }
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
    //hacky use of config.styling.calendarBorderThickness to accommodate the fact that svg draws border partially inside the element on which the border is drawn
    // each sub draw() function returns the variable component's width or height that it is responsible for handling. This in turns enables us to properly resize the canvas.
    let yOffsetWithLabels = this.yOffset + config.styling.monthLabelsHeight;
    let yearListWidth;
    let monthGroupsWidth;
    let gridHeight;
    let canvasHeight;
    let canvasWidth;
    yearListWidth = this.drawYearList(this.xOffset, yOffsetWithLabels);
    monthGroupsWidth = this.drawMonthGroups(this.xOffset + yearListWidth, yOffsetWithLabels);
    // remove the doubly accounted this.xOffset. This could obviously be cleaned up, eventually
    gridHeight = this.drawCalendarBorder(this.xOffset, yOffsetWithLabels, this.xOffset);
    canvasHeight = config.styling.monthLabelsHeight + gridHeight + 2*config.styling.calendarBorderThickness + 2*this.yOffset;
    canvasWidth = yearListWidth + monthGroupsWidth + 2*config.styling.calendarBorderThickness + 2*this.xOffset;
    return {width: canvasWidth, height: canvasHeight}
  }
  drawYearList(xOffset, yOffset){
    let width = config.styling.yearCellWidth + config.styling.innerGridBorderThickness;
    let yearDataGroup = new DataGroup(this.data.yearsData, width);
    yearDataGroup.buildRepresentation(this.representation, xOffset, yOffset);
    return width;
  }
  drawMonthLabel(xOffset, monthGroupWidth, maxDays, monthName){
    let text = this.representation.text(monthName);
    HasRepresentation.styleText(text, config.styling.textSize*0.8);
    text.cx((monthGroupWidth+text.length())/2 + xOffset);
    text.y(config.styling.monthLabelsHeight);
  }
  drawMonthGroups(xOffset, yOffset) {
    //draw months
    let monthGroupsWidth = 0;
    for (let i=0; i<config.data.monthsLabels.length; i++) {
      let monthLabel = config.data.monthsLabels[i];
      let data = this.data.yearsData.map(year => year.monthsData[monthLabel.name]);
      let width = (config.styling.daySize*monthLabel.maxDays) + (config.styling.interBoxPadding*(monthLabel.maxDays-1)) + (2*config.styling.hPadding) + (config.styling.innerGridBorderThickness);
      let monthDataGroup = new DataGroup(data, width);
      let groupOffset = xOffset + monthGroupsWidth;
      monthDataGroup.buildRepresentation(this.representation, groupOffset, yOffset);
      this.drawMonthLabel(groupOffset, width, monthLabel.maxDays, monthLabel.name);
      monthGroupsWidth += width;
    }
    return monthGroupsWidth;
  }
  drawCalendarBorder(xOffset, yOffset, width) {
    // draw bounding box
    let height = (config.data.period*(config.styling.cellHeight)+config.styling.calendarBorderThickness);
    let rect;
    width -= 0.5*config.styling.calendarBorderThickness;
    rect = this.representation.rect(width, height);
    rect.fill({ opacity: 0 });
    rect.attr({ x: xOffset+config.styling.calendarBorderThickness, y: yOffset+config.styling.calendarBorderThickness });
    rect.attr({ stroke: '#000', 'stroke-width': config.styling.calendarBorderThickness});
    return height;
  }
}

function generateCalendar(startYear) {
  let startTime = Date.now();
  let data = new AllData(startYear);
  let masterDraw = SVG('drawing').size(1, 1);
  let calendarRepresentation = new CalendarRepresentation(data, xOffset=config.styling.xBleed, yOffset=config.styling.yBleed);
  let {width, height} = calendarRepresentation.buildRepresentation(masterDraw);
  masterDraw.size(width, height);
  console.log("Execution took " + (Date.now() - startTime) + " ms");
  //TODO: Trigger download of the SVG?
  //console.log(masterDraw.svg())
}

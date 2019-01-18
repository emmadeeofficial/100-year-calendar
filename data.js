class AllData {
  //contains all years
  constructor(startYear) {
    this.startYear = startYear;
    this.yearsData = Array.from(new Array(100), (x,i) => this.startYear+i).map(yearNum => new YearData(yearNum));
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
}

class MonthData {
  //contains data about a given month
  constructor(monthName, yearNum) {
    this.monthName = monthName;
    this.yearNum = yearNum;
    this.daysData = Array.from(new Array(31), (x,i) => i).map(dayNum => new DayData(dayNum, this.monthName, this.yearNum));
  }
  getDays(){
    // TODO: determine if this is useful or too verbose
    return this.daysData;
  }
}

class DayData {
  constructor(dayNum, monthName, yearNum) {
    this.dayNum = dayNum;
    this.monthName = monthName;
    this.yearNum = yearNum;
  }
}

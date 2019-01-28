const config = {
  startYear: 1991,
  daySize: 20,
  vPadding: 2,
  hPadding: 6,
  interBoxPadding: 3,
  textSize: "14",
// period in years
// code doesn't handle period that are not a multiple of the monthBlockSize well
  period: 40,
// TODO: change monthblocksize to something clearer (eg yearblocksize)
  monthBlockSize: 10,
  calendarBorderThickness: 0,
  innerGridThickness: 6,
  //TODO harmonize border var names
  innerCellWidth: 1,
//  monthsLabels: [{name: "January", maxDays: 31}, {name: "February", maxDays: 29}, {name: "March", maxDays: 31}, {name: "April", maxDays: 30}, {name: "May", maxDays: 31}, {name: "June", maxDays: 30}, {name: "July", maxDays: 31}, {name: "August", maxDays: 31}, {name: "September", maxDays: 30}, {name: "October", maxDays: 31}, {name: "November", maxDays: 30}, {name: "December", maxDays: 31}],
  monthsLabels: [{name: "January", maxDays: 31}, {name: "February", maxDays: 29}, {name: "March", maxDays: 31}],
  xBleed: 30,
  yBleed: 30,
  monthLabelsHeight: 20,
  get yearCellWidth() {
    return (2 * this.daySize) + (2 * this.hPadding);
  },
  get cellHeight() {
    return this.daySize + (2 * this.vPadding);
  },
};

generateCalendar(config.startYear);

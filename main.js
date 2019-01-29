const config = {
  data: {
    startYear: 1991,
    // period in years
    // code doesn't handle period that are not a multiple of the yearBlockSize well
    period: 40,
    yearBlockSize: 10,
    //monthsLabels: [{name: "January", maxDays: 31}, {name: "February", maxDays: 29}, {name: "March", maxDays: 31}, {name: "April", maxDays: 30}, {name: "May", maxDays: 31}, {name: "June", maxDays: 30}, {name: "July", maxDays: 31}, {name: "August", maxDays: 31}, {name: "September", maxDays: 30}, {name: "October", maxDays: 31}, {name: "November", maxDays: 30}, {name: "December", maxDays: 31}],
    // For dev purposes
    monthsLabels: [{name: "January", maxDays: 31}, {name: "February", maxDays: 29}, {name: "March", maxDays: 31}],
  },
  styling : {
    // font needs to be installed locally or referenced in html declarations
    font: 'Source Sans Pro',
    // standard day size
    daySize: 20,
    // spacing in between day blocks
    interBoxPadding: 3,
    textSize: "14",
    monthLabelsHeight: 20,
    // borders
    calendarBorderThickness: 6,
    innerGridBorderThickness: 2,
    innerCellBorderThickness: 1,
    // month-level vertical and horizontal padding
    vPadding: 2,
    hPadding: 6,
    // bleed edges for whole image
    xBleed: 30,
    yBleed: 30,
    get yearCellWidth() {
      return (2 * this.daySize) + (2 * this.hPadding);
    },
    get cellHeight() {
      return this.daySize + (2 * this.vPadding);
    },
  },
};

generateCalendar(config.data.startYear);

var elapsed = 0;
var duration = 1;
var refreshInterval = 60;
var setDate = function () {
  elapsed += 60;
  if (elapsed / 60 >= duration) {
    console.log(elapsed, duration);
    elapsed = 0;
  }
}
var startTicker = function() {
  setDate();
  var nextTick = refreshInterval - (Date.now() % refreshInterval);
  this.tick = setTimeout (function() { startTicker() }, nextTick);
}


startTicker();

const React = require('react');
const Chart = require('chart.js');
const CHART_POINTS = 8;
var StatusBlock = React.createClass({
  componentWillMount: function () {
  },
  getInitialState: function () {
    return { toggled: false }
  },
  getDataForChart: function (points) {
    var prev = this.props.prev.concat(this.props.content);
    if(points > prev.length) {
      points = prev.length;
    }

    var dataset = {
      labels: [],
      data: Array(points).fill(0),
      pointColors: [],
      pointSize: []
    }

    var last = prev[0].timestamp;
    var diff = this.props.content.timestamp - last;
    var interval = diff/points;

    var i = 0;
    var items = 0;

    const lerp = function (a, b, u) {
      return (1 - u) * a + u * b;
    };



    for (var point of prev) {
      var pdiff = point.timestamp - last;
      if(pdiff >= interval*(i+1) || point == prev[prev.length-1]) {
        dataset.data[i] /= items;
        dataset.labels.push(timeDifference(diff- (interval*(i+1))));
        dataset.pointSize = items;
        //33-100% Green ammount
        var colors = [20, 20, 20];

        if(dataset.data[i] > 33.3) {
          colors[1] = Math.round(lerp(20, 235, (dataset.data[i]-33.3)/66.6))
        }

        //0-33% < Red amount
        if(dataset.data[i] < 66.6) {
          colors[0] = Math.round(lerp(20, 235, (66.6-dataset.data[i])/66.6))
        }

        dataset.pointColors[i] = "rgb("+colors[0]+","+colors[1]+","+colors[2]+")";
        items = 0;
        i++;
      }
      if (point.status == "up") {
        dataset.data[i] += 100;
      }
      items++;

    }

    return dataset;
  },
  getChartData: function () {
    var data = this.getDataForChart(CHART_POINTS);
    return {
      labels: data.labels,
      datasets: [{
        label: 'Uptime %',
        data: data.data,
        borderColor: data.pointColors[data.pointColors.length-1],
        pointBackgroundColor: data.pointColors,
        pointRadius: data.pointSize,
        fill: false
      }]
    }
  },
  createHistoryChart: function () {
    this._chart = new Chart(this._canvas, {
      type: 'line',
      data: this.getChartData(),
      options: {
        animation: {
          duration: 0
        },
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          yAxes: [{
            ticks: {
              min: 0,
              max: 100,
              beginAtZero: true
            }
          }]
        }
      }
    });
  },
  componentWillUpdate: function (nextProps, nextState) {
    if(this.state.toggled != nextState.toggled) {
      if(nextState.toggled) {
        this.createHistoryChart();
      }
      else {
        this._chart.destroy();
      }
    }
  },
  render: function () {
    var diff = new Date() - this.props.time;
    var nicetime = timeDifference(diff);
    var classname = "status-block ";
    var status;

    if(this.props.content.status == "up" && diff < this.props.concern_interval*60000) {
      classname += "alive";
      status = "Online";
    }
    else if(this.props.content.status == "down") {
      classname += "error";
      status = "Offline";
    }
    else {
      classname += "unknown";
      status = "Unknown | Last Status: ";
    }

    if(this.state.toggled) {
      this._chart.config.data = this.getChartData();
      this._chart.update();
    }

    return (

    <div data-key={this.props.itemkey} className={classname}>
      <span onClick={this.expandStatusBlock} className="status-name">
        {this.props.content.name || this.props.itemkey}
        <span className="status-version">{this.props.content.version}</span>
      </span>
      <span className="status-status">
        {status || "Unknown"}
        <span className="status-code">{this.props.content.code}</span>
      </span>
      <span className="status-message">{this.props.content.message}</span>
      <div className="status-uptimechart">
        <canvas ref={(c) => this._canvas = c} height="180"/>
      </div>
      <time className="status-lastupdated" dateTime={this.props.time.toISOString()}>{nicetime}</time>

    </div>);
  },
  expandStatusBlock: function (element) {
    if(this.state.toggled) {
      element.target.parentNode.style['max-height'] = "10vh";
      this.setState({toggled: false});
    } else {
      element.target.parentNode.style['max-height'] = "80vh";
      this.setState({toggled: true});
    }
  }
});

function timeDifference (elapsed) {
  const msPerMinute = 60 * 1000;
  const msPerHour = msPerMinute * 60;
  const msPerDay = msPerHour * 24;
  const msPerMonth = msPerDay * 30;
  const msPerYear = msPerDay * 365;

  if (elapsed < msPerMinute) {
    return Math.round(elapsed/1000) + ' seconds ago';
  }

  else if (elapsed < msPerHour) {
    return Math.round(elapsed/msPerMinute) + ' minutes ago';
  }

    else if (elapsed < msPerDay ) {
      return Math.round(elapsed/msPerHour ) + ' hours ago';
    }

    else if (elapsed < msPerMonth) {
      return 'approximately ' + Math.round(elapsed/msPerDay) + ' days ago';
    }

    else if (elapsed < msPerYear) {
      return 'approximately ' + Math.round(elapsed/msPerMonth) + ' months ago';
    }

    else {
      return 'approximately ' + Math.round(elapsed/msPerYear ) + ' years ago';
    }
}

module.exports = StatusBlock;

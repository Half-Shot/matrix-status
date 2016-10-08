const React = require('react');
const StatusBlock = require('./StatusBlock.js');
var Interface = React.createClass({
  componentWillMount: function () {
    //Get current state
    //var state = this.props.room.getLiveTimeline().getState('f');
    // Get the important events
    // var state_ev = state.getStateEvents("uk.half-shot.status");
    // for(var ev of state_ev) {
    //   this.newStateEvent(ev);
    // }
    this.props.client.scrollback(this.props.room, 100).then(() => {
      for(var ev of this.props.room.getLiveTimeline().getEvents()) {
        this.newStateEvent(ev);
      }
    });
  },


  componentDidMount: function () {
    this.props.client.on("RoomState.events", this.newStateEvent);
    this.timer = setInterval(()=>{
      this.forceUpdate();
    }, 5000);//Update every minute.
  },

  componentWillUnmount: function () {
    this.props.client.removeListener("RoomState.events", this.newStateEvent);
    clearInterval(this.timer);
  },

  newStateEvent: function (chunk) {
    if(chunk.event.type != "uk.half-shot.status") {
      return;
    }
    var content = chunk.event.content;
    var items = this.state.status_items;
    var time = new Date(chunk.event.origin_server_ts);
    var shouldHide = content.status == "discontinued";
    if(shouldHide) {
      if(items.delete(chunk.event.state_key)) {
        this.setState({status_items: items});
      }
      return;
    }

    if( !items.has(chunk.event.state_key)) {
      items.set(chunk.event.state_key, {
        time: time,
        curr: content,
        prev: [] }
      );
    }
    else {
      var item = items.get(chunk.event.state_key);
      item.prev.push(item.curr);//TODO Trim to a sensible value
      item.curr = content;
      item.time = time;
      items.set(chunk.event.state_key, item);
    }
    //Sort items alphabetically
    this.setState({status_items: items});
  },

  newEvent: function (chunk) {
    var event = chunk.event;
    console.log("Event:", event);
  },

  getInitialState: function () {
    return {
      status_items: new Map()
    }
  },

  render: function () {
    var list = [];
    for(var [key, item] of this.state.status_items) {
      list.push(<StatusBlock concern_interval={this.props.concern_interval} time={item.time} content={item.curr} prev={item.prev} key={key} itemkey={key}/>);
    }
    return (
      <div>
        <header>
          <h1>{this.props.name}</h1>
        </header>
        <div className="status-interface">
          {list}
        </div>
        <p className="status-roomid">RoomID <span>{this.props.room.roomId}</span></p>
      </div>
    );
  }
});


module.exports = Interface;

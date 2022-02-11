import React, { Fragment } from 'react';
import { Switch, Route, withRouter } from "react-router-dom";
import firebase from 'firebase/app';
import 'firebase/auth';
import { connect } from 'react-redux';
import Div100vh from 'react-div-100vh';

import './App.css';
import {
  setUserName,
  setUserEmail,
  setUserPicture
} from './redux/appReducer';

import Overlay from './App/Overlay';
import TopBar from './App/TopBar';
import LeftPanel from './App/LeftPanel';
import MainPanel from './App/MainPanel';
import { ReactComponent as Menu } from './assets/icons/menu.svg';
import { ReactComponent as Close } from './assets/icons/close.svg';
import { startSocket } from './socket.js';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      pageLoaded: false,
      showLeftPanel: false,
      showCloseButton: false,
      mobile: false
    };

    this.checkMobile = this.checkMobile.bind(this)
    window.addEventListener("resize", this.checkMobile);
  }

  componentDidMount() {
    firebase.auth().onAuthStateChanged(user => {
      if (!user) {
        this.props.history.push("/welcome");
      } else {
        startSocket();
        this.props.setUserName(user.displayName);
        this.props.setUserEmail(user.email);
        let picture = user.photoURL
        if (picture == null) {
          picture = "/assets/images/default_profile_pic.png"; // Set default PFP
        }
        this.props.setUserPicture(picture);
      }
    });
  }

  componentDidUpdate() {
    if (!this.state.pageLoaded && this.props.dmsLoaded && this.props.groupsLoaded && this.props.peopleLoaded && this.props.socket == true) {
      // All backend data loaded, ready to close overlay and navigate home
      if (this.props.history.location.pathname == "/") {
        this.props.history.push("/home");
      }
      this.setState({
        pageLoaded: true
      });
    }

    if (this.state.pageLoaded && this.props.socket == false) {
      this.setState({
        pageLoaded: false
      });
    }
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.checkMobile);
  }

  checkMobile() {
    if (window.innerWidth <= 880 && !this.state.mobile) {
      this.setState({ mobile: true });
    } else if (window.innerWidth > 880 && this.state.mobile) {
      this.setState({ mobile: false });
    }
  }

  render() {
    var myTitle = "";
    var tnc = 0; // Total notification count
    var newHref = "/favicon_package/favicon.ico";
    const nc = this.props.notificationCount;
    Object.keys(nc).forEach(function(key) {
      tnc += nc[key];
    });
    if (tnc > 0) { // Set favicon to unread and set title prefix
      myTitle = "(" + tnc + ") ";
      newHref = "/favicon_package/nfavicon.ico"
    }
    if (this.props.currentPage != "") { // If the current page is Home, DMs, etc., add it to the title
      myTitle += this.props.currentPage + " - ";
    }
    myTitle += "Strawberry";

    // Set favicon and title based on if statements before
    const favicon = document.getElementById("favicon");
    favicon.href = newHref;
    document.title = myTitle;

    return (
      <Div100vh>
        <div className="App">

          <Switch>
            <Route path="/welcome">
              <Overlay type="welcome" />
            </Route>
            <Route path="/">
              {  this.state.pageLoaded ?

                <Fragment>
                  { this.state.mobile != true ? null :
                    <div className="appHamburgerIcon" onClick={() => {this.setState({showLeftPanel: true})}} style={this.state.showCloseButton ? {width: "54px"} : null}>
                      <Menu />
                      {this.state.showCloseButton ? <Close /> : null}
                    </div>
                  }
                  <TopBar />
                  <LeftPanel showLeftPanel={this.state.showLeftPanel} hideLeftPanel={() => {this.setState({showLeftPanel: false})}} />
                  <MainPanel setCloseButton={(value) => {this.setState({showCloseButton: value})} /* Shows close button when MPPopup is open */} />
                </Fragment>

                :

                null
              }

              <Overlay type="loading" hide={this.state.pageLoaded} socket={this.props.socket} multipleTabs={this.props.multipleTabs} dmsLoaded={this.props.dmsLoaded} groupsLoaded={this.props.groupsLoaded} peopleLoaded={this.props.peopleLoaded} />
            </Route>
          </Switch>
        </div>
      </Div100vh>
    );
  }
}

const mapStateToProps = (state) => ({
  name: state.app.name,
  email: state.app.email,
  picture: state.app.picture,

  dmsLoaded: state.app.dmsLoaded,
  groupsLoaded: state.app.groupsLoaded,
  peopleLoaded: state.app.peopleLoaded,
  socket: state.app.socket,
  multipleTabs: state.app.multipleTabs,

  currentPage: state.app.currentPage,
  notificationCount: state.app.notificationCount
});

const mapDispatchToProps = {
    setUserName,
    setUserEmail,
    setUserPicture
}

//export default withRouter(App);
export default connect(mapStateToProps, mapDispatchToProps)(withRouter(App));

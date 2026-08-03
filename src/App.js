import React, { useEffect, useState } from 'react';
import './App.css';
import Navbar from "./components/Navbar/nav";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";
import LoadingScreen from "./components/LoadingScreen/LoadingScreen";
import {
  BrowserRouter as Router,
  Route,
  Switch,
} from "react-router-dom";
import { useStateValue } from "./utils/stateProvider";
import { auth } from "./utils/firebase";
import { actionTypes } from "./utils/reducer";
import { UserContext } from './utils/UserContext';
import { Button } from "@material-ui/core";

// Direct imports - no lazy loading to fix routing issues
import WeatherClothes from "./Pages/WeatherClothes/weatherclothes";
import AddOutfit from './Pages/AddOutfit/addoutfit';
import Wardrobe from './Pages/Wardrobe/wardrobe';
import Location from "./Pages/Location/location";
import LogIn from "./Pages/LogIn/login";

// Routes component
const AppRoutes = () => {
  return (
    <Switch>
      <Route path="/wardrobe" component={Wardrobe} />
      <Route path="/location" component={Location} />
      <Route path="/add" component={AddOutfit} />
      <Route exact path="/" component={WeatherClothes} />
    </Switch>
  );
};

const App = () => {

  const [{ user }, dispatch] = useStateValue();
  const [fetching, setFetching] = useState();
  const [bck, setBck] = useState();
  const [infoPop, setInfoPop] = useState("none");
  const [infoContent, setInfoContent] = useState();
  const [confirmDl, setConfirmDl] = useState();

  useEffect(() => { 

    setFetching(true)
    // Check to see if user is logged in via firebase persistence
    auth.onAuthStateChanged(userSaved => {
      dispatch({
        type: actionTypes.SET_USER,
        // If there's a user send user info to data layer (will be null if no persistence user)
        user: userSaved
    })
    setFetching(false)
    })

  },[dispatch])

  const popContent = (content) => {
    if (content === "how") {

      return(
        <>
          <li><h2>1. Enter Your Location</h2></li>
          <li><h2>2. Upload Photos Of Your Wardrobe</h2></li>
          <li><h2>3. View Your Outfit Each Day</h2></li>
        </>
      )

    }
    if (content === "img") return(<li><h2>Image Uploaded</h2></li>)
    if (content === "update") return(<li><h2>Updated</h2></li>)
    if (content === "added") return(<li><h2>✓ Outfit Added Successfully!</h2></li>)
    // if (content === "rmvFit") return(<li><h2>Are You Sure?</h2><Button onClick={setConfirmDl("yes")}>Yes</Button></li>)
  }

  return (
    <ErrorBoundary>
      <div className="app" style={{backgroundImage: bck, height:"100vh", width:"100vw", zIndex:"2"}}>
        {
        !user ? (
          fetching ? (
            <LoadingScreen />
          ) : (
            <LogIn />
          )
        ) : (

          <Router>

            <div>
              <UserContext.Provider value={{setBck, setInfoPop, setInfoContent, confirmDl, setConfirmDl}}>

              <div style={{display:infoPop, zIndex:999}} className="info-pop">
                <ul>
                  {popContent(infoContent)}
                  <li><Button onClick={() => setInfoPop("none")}>Close</Button></li>
                </ul>
                  <br/>
                  <br/>
              </div>

              <Navbar />

              <AppRoutes />

            </UserContext.Provider>
          </div>

        </Router>

        )
        }

      </div>
    </ErrorBoundary>
  );
}

export default App;

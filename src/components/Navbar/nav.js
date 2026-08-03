import React, { useState, useEffect, useContext } from "react";
import "./nav.css";
import SettingsSharpIcon from '@material-ui/icons/SettingsSharp';
import { IconButton, Avatar } from "@material-ui/core";
import { useStateValue } from "../../utils/stateProvider";
import { useHistory } from "react-router-dom";
// import moment from "moment";
import { auth } from "../../utils/firebase";
import { Button } from "@material-ui/core";
import API from "../../utils/API";
import db from "../../utils/firebase";
import temp from "../../images/temp.png";
import info from "../../images/info.png";
import { UserContext } from "../../utils/UserContext";

const Navbar = () => {

    // Get User info from data layer
    const [{ user }] = useStateValue();
    // Determine if nav pop is open/closed
    const [navActive, setNavActive] = useState("false");
    // Determine annimation
    const [fadeIn, setFadeIn] = useState(0);
    const history = useHistory();
    const [location, setLocation] = useState();
    const [todaysTemp, setTodaysTemp] = useState();
    const [todayDescript, setTodayDescript] = useState();
    const [tempUnit, setTempUnit] = useState('F'); // 'F' or 'C'
    const {setInfoPop, setInfoContent} = useContext(UserContext);

    useEffect(() => {
        // Load temperature unit preference from localStorage
        const savedUnit = localStorage.getItem('tempUnit');
        if (savedUnit === 'C' || savedUnit === 'F') {
            setTempUnit(savedUnit);
        }
    }, []);

    useEffect(() => {

        // Get location data from DB
        const unsubscribe = db
        .collection("city")
        .where('uid', '==', user.uid)
        .onSnapshot(snapshot => {
            const cities = snapshot.docs.map((doc) => doc.data().city);
            if (cities.length > 0) {
                setLocation(cities[0]); // Get first city only, not array
            }
        })

        // Cleanup function
        return () => unsubscribe();

    //eslint-disable-next-line
    },[])

    useEffect(() => {

        // Get weather data from API based on city from DB
        if (location) {
            API.search(location)
            .then((res) => {
                setTodaysTemp(res.data.list[0].main.temp)
                setTodayDescript(res.data.list[0].weather[0].description)
            })
            .catch((error) => {
                console.error('Error fetching weather:', error);
                // Don't crash the app, just log the error
            });
        }

    },[location])
    
    // Toggle Our Navigation Bar
    const toggleNav = () => {

        if (navActive === "true") {
            setNavActive("false")
            setFadeIn(0)
        } else {
            setNavActive("true")
            setFadeIn(1)
        }

    };

    // Click handle events for nav links
    const linkAction = (link) => {

        switch (link) {
            case "/":
                history.push("/")
                break;

            case "/wardrobe":
                history.push("/wardrobe")
                break;

            case "/add":
                history.push("/add")
                break;
            
            case "/location":
                history.push("/location")
                break;    
        
            default:
                break;
        }
        
        toggleNav();
    };

    // Convert kelvin temp to fahrenheit
    const kelvinToFaran = (kelvin) => {
        return (kelvin - 273.15) * 9/5 + 32
    };

    // Convert kelvin temp to celsius
    const kelvinToCelsius = (kelvin) => {
        return kelvin - 273.15
    };

    // Convert temperature based on user preference
    const convertTemp = (kelvin) => {
        if (tempUnit === 'C') {
            return Math.round(kelvinToCelsius(kelvin));
        } else {
            return Math.round(kelvinToFaran(kelvin));
        }
    };

    // Toggle temperature unit
    const toggleTempUnit = () => {
        const newUnit = tempUnit === 'F' ? 'C' : 'F';
        setTempUnit(newUnit);
        localStorage.setItem('tempUnit', newUnit);
    };

    const signOut = () => {
        auth.signOut()
    };

    return(
        <header>

            <nav>

                <div className="bar">
                    
                    <IconButton id="gear" onClick={toggleNav}><SettingsSharpIcon /></IconButton>
                    
                    <p style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {
                            (()=> {

                                if (typeof todaysTemp === "number") {

                                    const temperature = convertTemp(todaysTemp) + "°" + tempUnit;

                                    return (
                                        <>
                                            <img src={temp} alt="tempurature-icon" height="25px" width="25px"/>
                                            <span>{temperature + " " + todayDescript}</span>
                                            <button
                                                onClick={toggleTempUnit}
                                                style={{
                                                    marginLeft: '5px',
                                                    padding: '2px 6px',
                                                    fontSize: '11px',
                                                    background: 'rgba(255,255,255,0.2)',
                                                    border: '1px solid rgba(255,255,255,0.3)',
                                                    borderRadius: '3px',
                                                    cursor: 'pointer',
                                                    color: 'inherit'
                                                }}
                                                title={`Switch to °${tempUnit === 'F' ? 'C' : 'F'}`}
                                            >
                                                °{tempUnit === 'F' ? 'C' : 'F'}
                                            </button>
                                        </>
                                    )
                                }
                                else {

                                    return 0

                                }
                                })()
                        }
                        {/* {moment().format("MMM Do YY")} */}
                    </p>

                </div>

                <ul className={`nav-links ${navActive === "true" ? "nav-active" : ""}`} fadein={fadeIn} onAnimationEnd={() => {setFadeIn(0)}}>
                    
                    <li><Avatar src={user.photoURL}/></li>
                    <li onClick={() => { toggleNav(); window.location.href = '/location'; }}>Location</li>
                    <li onClick={() => { toggleNav(); window.location.href = '/wardrobe'; }}>Wardrobe</li>
                    <li onClick={() => { toggleNav(); window.location.href = '/'; }}>Today's Outfit</li>
                    <li className="how" onClick={() => {setInfoPop("block"); setInfoContent("how")}}>How to&nbsp;<img src={info} alt="info" width="15" heigh="15"/></li>
                    <li><Button id="sign-out" onClick={signOut}>Sign Out</Button></li>

                </ul>
                    
            </nav>
            
        </header>
    )
}

export default Navbar;
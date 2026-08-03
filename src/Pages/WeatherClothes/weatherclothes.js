import React, {useState, useEffect, useContext} from "react";
import { Button } from "@material-ui/core";
import "./weatherclothes.css";
import db from "../../utils/firebase";
import { useStateValue } from "../../utils/stateProvider";
import moment from "moment";
import API from "../../utils/API";
import { UserContext } from "../../utils/UserContext";
import info from "../../images/info.png";

const WeatherClothes = () => {
    const [{ user }] = useStateValue();
    const [outfit, setOutfit] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [noFits, setNoFits] = useState(false);
    const {setBck, setInfoPop, setInfoContent} = useContext(UserContext);

    const weekDay = moment().format('dddd');
    const today = moment().format('YYYY-MM-DD');

    useEffect(() => {
        setBck("-webkit-linear-gradient(150deg, #ecdfd100 50%, #fcf3ed 50%)");

        // Main data fetching logic
        const fetchAndDetermineOutfit = async () => {
            try {
                setLoading(true);
                setError(null);

                // Check cache first
                const cachedData = getCachedOutfit();
                if (cachedData && cachedData.date === today) {
                    setOutfit(cachedData.outfit);
                    setLoading(false);
                    return;
                }

                // Step 1: Fetch location (use .get() instead of onSnapshot)
                const citySnapshot = await db
                    .collection("city")
                    .where('uid', '==', user.uid)
                    .get();

                if (citySnapshot.empty) {
                    setError("Please set your location first");
                    setLoading(false);
                    return;
                }

                const location = citySnapshot.docs[0].data().city;

                // Step 2: Fetch weather data
                const weatherResponse = await API.search(location);
                const todaysTemp = weatherResponse.data.list[0].main.temp;
                const todaysWeather = weatherResponse.data.list[0].weather[0].main.toLowerCase();

                // Step 3: Fetch user's outfits
                const outfitsSnapshot = await db
                    .collection("wardrobe")
                    .where('uid', '==', user.uid)
                    .get();

                if (outfitsSnapshot.empty) {
                    setNoFits(true);
                    setLoading(false);
                    return;
                }

                const outfits = outfitsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Step 4: Select best outfit
                const selectedOutfit = selectBestOutfit(outfits, todaysTemp, todaysWeather);

                // Step 5: Cache and display
                cacheOutfit(selectedOutfit, today);
                setOutfit(selectedOutfit);
                setLoading(false);

            } catch (err) {
                console.error("Error fetching outfit:", err);

                // Provide specific error messages
                if (err.message && err.message.includes('404')) {
                    setError("City not found. Please check your location settings.");
                } else if (err.message && err.message.includes('API')) {
                    setError("Weather service unavailable. Please try again later.");
                } else {
                    setError("Unable to load outfit. Please check your internet connection.");
                }

                setLoading(false);
            }
        };

        fetchAndDetermineOutfit();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user.uid, today]); // Re-run if user changes or new day

    // Smart outfit selection logic
    const selectBestOutfit = (outfits, tempKelvin, weatherCondition) => {
        const tempF = (tempKelvin - 273.15) * 9/5 + 32;

        // Filter by temperature
        let filteredOutfits = outfits.filter(fit => {
            if (tempF >= 75) return fit.temperature === "hot";
            if (tempF >= 60 && tempF < 75) return fit.temperature === "neutral";
            return fit.temperature === "cold";
        });

        // If no outfits match temperature, fallback to all outfits
        if (filteredOutfits.length === 0) {
            filteredOutfits = outfits;
        }

        // Further filter by weather condition if outfit has weather field
        const weatherMatchingOutfits = filteredOutfits.filter(fit => {
            if (!fit.weather) return false;
            const outfitWeather = fit.weather.toLowerCase();
            return outfitWeather.includes(weatherCondition) ||
                   weatherCondition.includes(outfitWeather);
        });

        // Use weather-matching outfits if available
        if (weatherMatchingOutfits.length > 0) {
            filteredOutfits = weatherMatchingOutfits;
        }

        // Avoid showing the same outfit as yesterday
        const yesterdayOutfitId = getYesterdayOutfit();
        if (filteredOutfits.length > 1 && yesterdayOutfitId) {
            const differentOutfits = filteredOutfits.filter(fit => fit.id !== yesterdayOutfitId);
            if (differentOutfits.length > 0) {
                filteredOutfits = differentOutfits;
            }
        }

        // Random selection from filtered outfits
        const randomIndex = Math.floor(Math.random() * filteredOutfits.length);
        return filteredOutfits[randomIndex];
    };

    // Cache management
    const getCachedOutfit = () => {
        try {
            const cached = localStorage.getItem(`outfit_${today}`);
            return cached ? JSON.parse(cached) : null;
        } catch {
            return null;
        }
    };

    const cacheOutfit = (outfit, date) => {
        try {
            // Store today's outfit
            localStorage.setItem(`outfit_${date}`, JSON.stringify({
                outfit,
                date,
                id: outfit.id
            }));

            // Clean up old cache entries (keep last 7 days)
            cleanOldCache();
        } catch (err) {
            console.error("Error caching outfit:", err);
        }
    };

    const getYesterdayOutfit = () => {
        try {
            const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');
            const cached = localStorage.getItem(`outfit_${yesterday}`);
            return cached ? JSON.parse(cached).id : null;
        } catch {
            return null;
        }
    };

    const cleanOldCache = () => {
        try {
            const keys = Object.keys(localStorage);
            const outfitKeys = keys.filter(key => key.startsWith('outfit_'));
            const sevenDaysAgo = moment().subtract(7, 'days');

            outfitKeys.forEach(key => {
                const date = key.replace('outfit_', '');
                if (moment(date).isBefore(sevenDaysAgo)) {
                    localStorage.removeItem(key);
                }
            });
        } catch (err) {
            console.error("Error cleaning cache:", err);
        }
    };

    // Render logic
    const renderContent = () => {
        if (loading) {
            return <p>Loading your perfect outfit...</p>;
        }

        if (error) {
            return (
                <div>
                    <p style={{color: '#d32f2f', marginBottom: '10px'}}>{error}</p>
                    <Button onClick={() => window.location.reload()}>
                        Try Again
                    </Button>
                </div>
            );
        }

        if (noFits) {
            return (
                <div className="how" onClick={() => {setInfoPop("block"); setInfoContent("how");}}>
                    <h3>How to</h3>&nbsp;<img src={info} alt="info" width="15" height="15"/>
                </div>
            );
        }

        if (outfit && outfit.image) {
            return <img src={outfit.image} alt="outfit" height="300px" width="auto"/>;
        }

        return null;
    };

    return (
        <>
            <div className="container" style={{animation: 'fadeIn 0.5s ease-in'}}>
                <div className="row text-center">
                    <div className="col-12">
                        <ul className="day-list">
                            <li className={weekDay === "Monday" ? "current-day" : "days"}>M</li>
                            <li className={weekDay === "Tuesday" ? "current-day" : "days"}>T</li>
                            <li className={weekDay === "Wednesday" ? "current-day" : "days"}>W</li>
                            <li className={weekDay === "Thursday" ? "current-day" : "days"}>T</li>
                            <li className={weekDay === "Friday" ? "current-day" : "days"}>F</li>
                            <li className={weekDay === "Saturday" ? "current-day" : "days"}>S</li>
                            <li className={weekDay === "Sunday" ? "current-day" : "days"}>S</li>
                        </ul>
                    </div>
                </div>

                <div className="row text-center">
                    <div className="col"></div>
                    <div className="col" style={{animation: 'slideUp 0.6s ease-out 0.2s both'}}>
                        <h1 style={{animation: 'slideInFromRight 0.5s ease-out 0.3s both'}}>Today's Outfit</h1>
                        <hr style={{animation: 'scaleX 0.4s ease-out 0.5s both', transformOrigin: 'center'}} />
                        <div style={{animation: 'scaleIn 0.5s ease-out 0.6s both'}}>
                            {renderContent()}
                        </div>
                    </div>
                    <div className="col"></div>
                </div>

                <div className="day-page"></div>
            </div>
        </>
    );
};

export default WeatherClothes;

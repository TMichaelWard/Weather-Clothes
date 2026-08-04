import React, { useEffect, useState, useContext, useRef } from "react";
import db from "../../utils/firebase";
import { useStateValue } from "../../utils/stateProvider";
import AddOutlinedIcon from '@material-ui/icons/AddOutlined';
import EditIcon from '@material-ui/icons/Edit';
import FilterListIcon from '@material-ui/icons/FilterList';
import SearchIcon from '@material-ui/icons/Search';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';
import { IconButton, TextField, Select, MenuItem, FormControl, InputLabel, Chip } from "@material-ui/core";
import { useHistory } from "react-router-dom";
import "./wardrobe.css";
import hanger from "../../images/hanger.png";
import closet from "../../images/closet.png";
import { UserContext } from "../../utils/UserContext";
import garmetsBck from "../../images/garmets.png";

const W2 = () => {
    const [{ user }] = useStateValue();
    const [outfits, setOutfits] = useState([]);
    const [filteredOutfits, setFilteredOutfits] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [temperatureFilter, setTemperatureFilter] = useState("all");
    const [contextFilter, setContextFilter] = useState("all");
    const [weatherFilter, setWeatherFilter] = useState("all");
    const [showFilters, setShowFilters] = useState(false);
    const history = useHistory();
    const {setBck} = useContext(UserContext);
    const carouselRef = useRef(null);

    // Get outfits
    useEffect(() => {
        setBck(`url(${garmetsBck})`);

        const unsubscribe = db
            .collection("wardrobe")
            .where('uid', '==', user.uid)
            .onSnapshot(snapshot => {
                const outfitsData = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setOutfits(outfitsData);
            });

        return () => unsubscribe();
    }, [user.uid, setBck]);

    // Filter and search logic
    useEffect(() => {
        if (!outfits || outfits.length === 0) {
            setFilteredOutfits([]);
            return;
        }

        let result = [...outfits];

        // Search filter
        if (searchTerm) {
            result = result.filter(outfit =>
                outfit.outfit && outfit.outfit.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Temperature filter
        if (temperatureFilter !== "all") {
            result = result.filter(outfit => outfit.temperature === temperatureFilter);
        }

        // Context filter
        if (contextFilter !== "all") {
            result = result.filter(outfit => outfit.context === contextFilter);
        }

        // Weather filter
        if (weatherFilter !== "all") {
            result = result.filter(outfit => outfit.weather === weatherFilter);
        }

        setFilteredOutfits(result);
    }, [searchTerm, temperatureFilter, contextFilter, weatherFilter, outfits]);

    const removeFit = (outfitId, outfitName) => {
        const confirmDl = window.confirm(`Delete "${outfitName}"?`);

        if (confirmDl) {
            db.collection("wardrobe")
                .doc(outfitId)
                .delete()
                .catch((error) => {
                    console.error("Error removing outfit:", error);
                    alert("Error removing outfit. Please try again.");
                });
        }
    };

    const editOutfit = (outfit) => {
        localStorage.setItem('editingOutfit', JSON.stringify(outfit));
        window.location.href = `/add?edit=${outfit.id}`;
    };

    const resetFilters = () => {
        setSearchTerm("");
        setTemperatureFilter("all");
        setContextFilter("all");
        setWeatherFilter("all");
    };

    const activeFiltersCount = [temperatureFilter, contextFilter, weatherFilter]
        .filter(f => f !== "all").length;

    const displayOutfits = filteredOutfits.length > 0 ? filteredOutfits : outfits;

    const scrollNext = () => {
        if (carouselRef.current) {
            const scrollAmount = carouselRef.current.offsetWidth * 0.8;
            carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    const scrollPrev = () => {
        if (carouselRef.current) {
            const scrollAmount = carouselRef.current.offsetWidth * 0.8;
            carouselRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        }
    };

    return(
        <div className="wardrobe-page" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Carousel with Navigation Arrows */}
            <div style={{ position: 'relative', maxHeight: 'calc(100vh - 280px)', display: 'flex', alignItems: 'center' }}>
                {/* Previous Arrow */}
                <IconButton
                    onClick={scrollPrev}
                    className="swiper-button-prev"
                    style={{
                        position: 'absolute',
                        left: '10px',
                        zIndex: 10,
                        background: 'rgba(255, 255, 255, 0.9)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        '&:hover': {
                            background: 'rgba(255, 255, 255, 1)'
                        }
                    }}
                >
                    <ArrowBackIosIcon style={{ color: 'black' }} />
                </IconButton>

                {/* Carousel */}
                <div
                    ref={carouselRef}
                    className="mySwiper"
                    style={{
                        display: 'flex',
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        gap: '50px',
                        padding: '20px 50px',
                        scrollBehavior: 'smooth',
                        WebkitOverflowScrolling: 'touch',
                        flex: 1,
                        alignItems: 'center',
                        minHeight: 0,
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none'
                    }}
                >
                {displayOutfits && displayOutfits.length > 0 ? (
                    displayOutfits.map(outfit => (
                        <div key={outfit.id} className="swiper-slide" style={{
                            flex: '0 0 auto',
                            scrollSnapAlign: 'center',
                            position: 'relative',
                            minWidth: '300px',
                            maxWidth: '400px'
                        }}>
                            {/* Outfit name - exact master style */}
                            <h1 id="fit-name" style={{
                                textAlign: 'center',
                                fontSize: '2em',
                                marginBottom: '10px',
                                color: '#333'
                            }}>{outfit.outfit}</h1>

                            {/* Delete button - exact master style */}
                            <IconButton
                                onClick={() => removeFit(outfit.id, outfit.outfit)}
                                style={{
                                    display: 'block',
                                    margin: '0 auto 10px',
                                    padding: '8px'
                                }}
                            >
                                <img src={hanger} alt="hanger" width="25" height="25" id="hang"/>
                            </IconButton>

                            {/* Edit button overlay - always visible */}
                            <div
                                className="edit-icon-overlay"
                                style={{
                                    position: 'absolute',
                                    top: '10px',
                                    right: '10px',
                                    display: 'flex',
                                    gap: '5px'
                                }}
                            >
                                <IconButton
                                    size="small"
                                    onClick={() => editOutfit(outfit)}
                                    title="Edit outfit"
                                    style={{
                                        background: 'rgba(255,255,255,0.9)',
                                        padding: '5px',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                    }}
                                >
                                    <EditIcon style={{ width: '16px', height: '16px' }} />
                                </IconButton>
                            </div>

                            {/* Outfit image - exact master style */}
                            <img
                                src={outfit.image}
                                alt="outfit"
                                id="fit-pic"
                                style={{
                                    width: '100%',
                                    maxHeight: '500px',
                                    objectFit: 'cover',
                                    borderRadius: '8px',
                                    display: 'block'
                                }}
                            />

                            {/* Metadata chips - subtle, below image */}
                            {(outfit.temperature || outfit.context || outfit.weather) && (
                                <div style={{
                                    display: 'flex',
                                    gap: '4px',
                                    justifyContent: 'center',
                                    flexWrap: 'wrap',
                                    marginTop: '8px'
                                }}>
                                    {outfit.temperature && (
                                        <Chip
                                            label={outfit.temperature}
                                            size="small"
                                            style={{
                                                height: '20px',
                                                fontSize: '10px',
                                                background: outfit.temperature === 'hot' ? '#ffebee' :
                                                           outfit.temperature === 'cold' ? '#e3f2fd' : '#fff3e0',
                                                color: outfit.temperature === 'hot' ? '#d32f2f' :
                                                       outfit.temperature === 'cold' ? '#1976d2' : '#e65100',
                                                border: 'none',
                                                opacity: 0.8
                                            }}
                                        />
                                    )}
                                    {outfit.context && (
                                        <Chip
                                            label={outfit.context}
                                            size="small"
                                            style={{
                                                height: '20px',
                                                fontSize: '10px',
                                                background: '#f5f5f5',
                                                color: '#666',
                                                opacity: 0.8
                                            }}
                                        />
                                    )}
                                    {outfit.weather && (
                                        <Chip
                                            label={outfit.weather}
                                            size="small"
                                            style={{
                                                height: '20px',
                                                fontSize: '10px',
                                                background: '#f5f5f5',
                                                color: '#666',
                                                opacity: 0.8
                                            }}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <p style={{ width: '100%', textAlign: 'center' }}>Add outfits</p>
                )}
                </div>

                {/* Next Arrow */}
                <IconButton
                    onClick={scrollNext}
                    className="swiper-button-next"
                    style={{
                        position: 'absolute',
                        right: '10px',
                        zIndex: 10,
                        background: 'rgba(255, 255, 255, 0.9)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        '&:hover': {
                            background: 'rgba(255, 255, 255, 1)'
                        }
                    }}
                >
                    <ArrowForwardIosIcon style={{ color: 'black' }} />
                </IconButton>
            </div>

            {/* Floating transparent search bar */}
            <div style={{
                paddingTop: '10px',
                paddingBottom: '10px',
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                zIndex: 10,
                flexShrink: 0
            }}>
                {/* Compact Search */}
                <TextField
                    placeholder="Search..."
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: <SearchIcon style={{ fontSize: '18px', marginRight: '4px', color: '#666' }} />
                    }}
                    style={{
                        width: '220px',
                        background: 'rgba(255, 255, 255, 0.85)',
                        borderRadius: '4px',
                        backdropFilter: 'blur(10px)'
                    }}
                />

                {/* Compact Filter Toggle */}
                <IconButton
                    size="small"
                    onClick={() => setShowFilters(!showFilters)}
                    style={{
                        position: 'relative',
                        background: showFilters ? 'rgba(227, 242, 253, 0.9)' : 'rgba(255, 255, 255, 0.85)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(0,0,0,0.1)'
                    }}
                    title="Filter options"
                >
                    <FilterListIcon style={{ fontSize: '20px' }} />
                    {activeFiltersCount > 0 && (
                        <span style={{
                            position: 'absolute',
                            top: 2,
                            right: 2,
                            background: '#f44336',
                            color: 'white',
                            borderRadius: '50%',
                            width: '16px',
                            height: '16px',
                            fontSize: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold'
                        }}>
                            {activeFiltersCount}
                        </span>
                    )}
                </IconButton>
            </div>

            {/* Collapsible Filter Options */}
            {showFilters && (
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    padding: '10px',
                    borderRadius: '4px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    margin: '0 auto 10px',
                    maxWidth: '600px',
                    flexShrink: 0
                }}>
                    <FormControl variant="outlined" size="small" style={{ minWidth: 110 }}>
                        <InputLabel style={{ fontSize: '14px' }}>Temperature</InputLabel>
                        <Select
                            value={temperatureFilter}
                            onChange={(e) => setTemperatureFilter(e.target.value)}
                            label="Temperature"
                            style={{ fontSize: '14px', background: 'white' }}
                        >
                            <MenuItem value="all">All</MenuItem>
                            <MenuItem value="hot">Hot</MenuItem>
                            <MenuItem value="neutral">Neutral</MenuItem>
                            <MenuItem value="cold">Cold</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl variant="outlined" size="small" style={{ minWidth: 110 }}>
                        <InputLabel style={{ fontSize: '14px' }}>Context</InputLabel>
                        <Select
                            value={contextFilter}
                            onChange={(e) => setContextFilter(e.target.value)}
                            label="Context"
                            style={{ fontSize: '14px', background: 'white' }}
                        >
                            <MenuItem value="all">All</MenuItem>
                            <MenuItem value="home">Home</MenuItem>
                            <MenuItem value="work">Work</MenuItem>
                            <MenuItem value="casual">Casual</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl variant="outlined" size="small" style={{ minWidth: 110 }}>
                        <InputLabel style={{ fontSize: '14px' }}>Weather</InputLabel>
                        <Select
                            value={weatherFilter}
                            onChange={(e) => setWeatherFilter(e.target.value)}
                            label="Weather"
                            style={{ fontSize: '14px', background: 'white' }}
                        >
                            <MenuItem value="all">All</MenuItem>
                            <MenuItem value="clear Sky">Clear Sky</MenuItem>
                            <MenuItem value="overcast">Overcast</MenuItem>
                            <MenuItem value="rain">Rain</MenuItem>
                            <MenuItem value="sunny">Sunny</MenuItem>
                        </Select>
                    </FormControl>

                    {activeFiltersCount > 0 && (
                        <button
                            onClick={resetFilters}
                            style={{
                                padding: '5px 12px',
                                background: '#f5f5f5',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                height: '40px'
                            }}
                        >
                            Clear
                        </button>
                    )}
                </div>
            )}

            {/* Add Outfit Button - exact master style */}
            <div className="add-fit" style={{
                width: '100%',
                textAlign: 'center',
                padding: '10px 0 40px 0',
                flexShrink: 0,
                marginBottom: '20px'
            }}>
                <img src={closet} alt="closet"/><br/>
                <IconButton onClick={() => window.location.href = "/add"}>
                    <AddOutlinedIcon />
                </IconButton>
                <p style={{ margin: '5px 0 0 0' }}>Add Outfit</p>
            </div>
        </div>
    );
};

export default W2;

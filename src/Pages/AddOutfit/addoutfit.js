import React, { useEffect, useState, useContext } from "react";
import "./addoutfit.css";
import { useStateValue } from "../../utils/stateProvider";
import db from "../../utils/firebase";
import { Button } from "@material-ui/core";
import { useHistory, useLocation } from "react-router-dom";
import { uploadImage } from "../../utils/supabase";
// import { Toast } from 'react-bootstrap';
import garmetsBck from "../../images/garmets.png";
import { UserContext } from "../../utils/UserContext";
import { sanitizeText, validateOutfitName, validateImageFile } from "../../utils/validation";
import imageCompression from 'browser-image-compression';

const AddOutfit = () => {

    // Get loggedin user info
    const [{ user }] = useStateValue();
    const history = useHistory();
    const location = useLocation();
    // Get colleection from firebase
    const wardrobeRef = db.collection("wardrobe");
    const [outfitName, setOutfitName] = useState();
    const [imgUrl, setImgUrl] = useState();
    const [fitWeather, setFitWeather] = useState();
    const [fitTemp, setFitTemp] = useState();
    const [fitContext, setFitContext] = useState();
    const [errors, setErrors] = useState({});
    const [isEditMode, setIsEditMode] = useState(false);
    const [outfitId, setOutfitId] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const {setBck, setInfoPop, setInfoContent} = useContext(UserContext);

    useEffect(() => {

        setBck(`url(${garmetsBck})`);

        // Check if we're in edit mode
        const params = new URLSearchParams(location.search);
        const editId = params.get('edit');

        if (editId) {
            setIsEditMode(true);
            setOutfitId(editId);

            // Load outfit data from localStorage
            const editingOutfit = localStorage.getItem('editingOutfit');
            if (editingOutfit) {
                try {
                    const outfit = JSON.parse(editingOutfit);

                    // Pre-populate form fields
                    setOutfitName(outfit.outfit || '');
                    setImgUrl(outfit.image || '');
                    setFitWeather(outfit.weather || '');
                    setFitTemp(outfit.temperature || '');
                    setFitContext(outfit.context || '');

                    // Clean up localStorage
                    localStorage.removeItem('editingOutfit');
                } catch (error) {
                    console.error('Error loading outfit for editing:', error);
                    alert('Error loading outfit data. Redirecting to add mode.');
                    setIsEditMode(false);
                }
            }
        }

    },[setBck, location.search])

    const removeBackground = async (imageFile) => {
        const apiKey = process.env.REACT_APP_REMOVEBG_API_KEY;

        if (!apiKey) {
            console.warn('Remove.bg API key not configured. Skipping background removal.');
            return { file: imageFile, backgroundRemoved: false };
        }

        const formData = new FormData();
        formData.append("size", "preview"); // Use preview (free tier)
        formData.append("image_file", imageFile);

        try {
            const response = await fetch("https://api.remove.bg/v1.0/removebg", {
                method: "POST",
                headers: { "X-Api-Key": apiKey },
                body: formData,
            });

            if (response.ok) {
                const blob = await response.blob();
                // Convert blob to file
                const processedFile = new File([blob], imageFile.name, { type: 'image/png' });
                return { file: processedFile, backgroundRemoved: true };
            } else {
                const error = await response.json();
                console.warn('Remove.bg API error:', error);

                // Check if it's an insufficient credits error
                if (error.errors?.[0]?.code === 'insufficient_credits') {
                    console.warn('Out of Remove.bg API credits. Uploading image without background removal.');
                } else {
                    console.warn('Background removal failed. Uploading original image.');
                }

                return { file: imageFile, backgroundRemoved: false };
            }
        } catch (error) {
            console.warn('Error removing background. Uploading original image.', error);
            return { file: imageFile, backgroundRemoved: false };
        }
    };

    const handleImgUpload = async (imageFile) => {

        // Validate image file
        const validation = validateImageFile(imageFile);
        if (!validation.isValid) {
            setErrors({ ...errors, image: validation.error });
            alert(validation.error);
            return;
        }

        setErrors({ ...errors, image: '' });
        setIsProcessing(true);

        try {
            // Remove background from image using remove.bg API
            const { file: processedFile, backgroundRemoved } = await removeBackground(imageFile);

            // Show warning if background removal failed (but continue with upload)
            if (!backgroundRemoved && process.env.REACT_APP_REMOVEBG_API_KEY) {
                console.info('Continuing with image upload without background removal.');
            }

            // Compress image before uploading
            const options = {
                maxSizeMB: 1,          // Maximum file size in MB
                maxWidthOrHeight: 1920, // Maximum width or height
                useWebWorker: true,     // Use web workers for better performance
                fileType: backgroundRemoved ? 'image/png' : undefined   // Use PNG for transparency if background was removed
            };

            const compressedFile = await imageCompression(processedFile, options);

            // Upload compressed image to Supabase storage
            const url = await uploadImage(compressedFile, imageFile.name);
            setImgUrl(url);
            setIsProcessing(false);
        } catch (error) {
            setIsProcessing(false);
            console.error('Error processing image:', error);
            alert("Error processing image. Please try again.");
        }

    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            handleImgUpload(file); // Auto-upload immediately
        }
    };

    const addOutfit = () => {

        // Validate outfit name
        const validation = validateOutfitName(outfitName);
        if (!validation.isValid) {
            setErrors({ ...errors, outfitName: validation.error });
            alert(validation.error);
            return;
        }

        // Sanitize inputs before storing
        const sanitizedOutfitName = sanitizeText(outfitName);

        const outfitData = {
            uid: user.uid,
            outfit: sanitizedOutfitName,
            weather: fitWeather,
            temperature: fitTemp,
            image: imgUrl,
            context: fitContext
        };

        if (isEditMode && outfitId) {
            // Update existing outfit
            wardrobeRef.doc(outfitId)
                .update(outfitData)
                .then(() => {
                    setInfoPop("block");
                    setInfoContent("update");
                    history.push('/wardrobe');
                })
                .catch((error) => {
                    console.error("Error updating outfit:", error);
                    alert("Error updating outfit. Please try again.");
                });
        } else {
            // Create new outfit
            wardrobeRef.add(outfitData)
                .then(() => {
                    setInfoPop("block");
                    setInfoContent("added");
                    setTimeout(() => {
                        history.push('/wardrobe');
                    }, 1500); // Show success message for 1.5 seconds before redirecting
                })
                .catch((error) => {
                    console.error("Error adding outfit:", error);
                    alert("Error adding outfit. Please try again.");
                });
        }
    };

    return(

        <div className="add-page">

            <div className="row text-center">

                <div className="col">
                    
                    <form>

                        {//Outfit Name Entry
                        }
                        <h1 id="enter-fit">{isEditMode ? 'Edit Outfit' : 'Enter Outfit'}</h1>
                        <p><em>{isEditMode ? 'update your outfit details' : 'lay out your outfit and take a photo!'}</em></p>
                        <input type="text" placeholder="Name Your Outfit"
                        value={outfitName || ''}
                        onChange={(e) => setOutfitName(e.target.value)} id="fit-input"></input>

                        <br/>
                        <br/>

                        <input type="file" accept="image/*" onChange={handleFileSelect} id="img-upload" disabled={isProcessing}></input>

                        {isProcessing && (
                            <p className="processing-message">
                                <span className="spinner">⚙️</span>
                                Processing your image...
                            </p>
                        )}

                        <br/>
                        <br/>

                        {// Get Weather description input for oufit
                        }
                        <select className="custom-select" style={{width: "133px"}}
                            value={fitWeather || ''}
                            onChange={(e) => {
                                setFitWeather(e.target.value)
                            }}>
                            <option value="">Select Weather</option>
                            <option value="clear Sky" className="select-items">Clear Sky</option>
                            <option value="overcast">Overcast</option>
                            <option value="rain">Rain</option>
                            <option value="sunny">Sunny</option>
                        </select>

                        <select className="custom-select" style={{width: "133px"}}
                            value={fitTemp || ''}
                            onChange={(e) => {
                                setFitTemp(e.target.value)
                            }}>
                            <option value="">Select Temp</option>
                            <option value="neutral">Neutral</option>
                            <option value="hot">Hot</option>
                            <option value="cold">Cold</option>
                        </select>

                        <select className="custom-select" style={{width: "133px"}}
                            value={fitContext || ''}
                            onChange={(e) => {
                                setFitContext(e.target.value)
                            }}>
                            <option value="">Select Context</option>
                            <option value="home">Home</option>
                            <option value="work">Work</option>
                            <option value="casual">Casual</option>
                        </select>

                        <br/>
                        <br/>

                        {// If there is no outfit name and details disable submit button otherwise enable
                        }
                        {
                        outfitName && fitWeather && fitTemp && imgUrl && fitContext && !isProcessing ?
                        <Button onClick={() => addOutfit()}>{isEditMode ? 'Update' : 'Submit'}</Button>
                        :
                        <Button disabled>{isEditMode ? 'Update' : 'Submit'}</Button>
                        }
                        
                    </form>

                </div>

            </div>

            <div className="row"></div>

        </div>
        
        )

};

export default AddOutfit;
// Global variables
let selectedPlaces = [];
let tripPreferences = {};
let allPlaces = [];

// Initialize the page
document.addEventListener("DOMContentLoaded", async function () {
    initializeTabs();
    await loadTripData();

    // Set up event listeners
    document.getElementById("saveTripBtn").addEventListener("click", saveTrip);
    document.getElementById("shareTripBtn").addEventListener("click", shareTrip);
});

// Load trip data from Django session/context
async function loadTripData() {
    try {
        // First try to get data from Django template context (if available)
        if (typeof window.tripData !== 'undefined') {
            updateTripHeaderFromData(window.tripData);
            renderPlaces(window.tripData.places || []);
            return;
        }

        // Fallback: try to fetch from session or show loading
        await loadRecommendedPlaces();
    } catch (error) {
        console.error("Error loading trip data:", error);
        showNotification("Failed to load trip data", "error");
    }
}

// Load recommended places from session/API
async function loadRecommendedPlaces() {
    const placesGrid = document.getElementById("placesGrid");
    const placesLoading = document.getElementById("placesLoading");
    const placesEmpty = document.getElementById("placesEmpty");

    placesGrid.innerHTML = "";
    placesLoading.style.display = "flex";
    placesEmpty.style.display = "none";

    try {
        // Check if we have places in the current page context first
        const currentPagePlaces = document.querySelector('#places-data');
        if (currentPagePlaces) {
            const data = JSON.parse(currentPagePlaces.textContent);
            allPlaces = data.places || [];
            updateTripHeaderFromData(data);
            renderPlaces(allPlaces);
            return;
        }

        // If no embedded data, try to fetch current session data
        const response = await fetch('/api/get_trip_data/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success && data.places && data.places.length > 0) {
                allPlaces = data.places;
                updateTripHeaderFromData(data);
                renderPlaces(allPlaces);
            } else {
                placesEmpty.style.display = "flex";
            }
        } else {
            throw new Error('Failed to load trip data');
        }
    } catch (error) {
        console.error("Error loading places:", error);
        placesEmpty.style.display = "flex";
        showNotification("Failed to load places. Please try refreshing the page.", "error");
    } finally {
        placesLoading.style.display = "none";
    }
}

// Update trip header with data from response
function updateTripHeaderFromData(data) {
    tripPreferences = {
        destination: data.destination || "Your Destination",
        group_size: data.group_size || 1,
        duration: data.duration || 3,
        moods: data.moods || [],
        interests: data.interests || [],
        travel_style: data.travel_style || "relaxed",
        budget: data.budget || "medium"
    };

    // Update header elements safely
    const destinationHeader = document.getElementById("destinationHeader");
    const tripDestination = document.getElementById("tripDestination");
    const tripTravelers = document.getElementById("tripTravelers");
    const tripDuration = document.getElementById("tripDuration");
    const tripInterests = document.getElementById("tripInterests");

    if (destinationHeader) destinationHeader.textContent = tripPreferences.destination;
    if (tripDestination) tripDestination.textContent = tripPreferences.destination;
    if (tripTravelers) tripTravelers.textContent = `${tripPreferences.group_size} ${getTravelerText(tripPreferences.group_size)}`;
    if (tripDuration) tripDuration.textContent = `${tripPreferences.duration} days`;
    if (tripInterests) {
        const interests = tripPreferences.interests.length > 0 ? 
            tripPreferences.interests.join(", ") : 
            (tripPreferences.moods.length > 0 ? tripPreferences.moods.join(", ") : "General sightseeing");
        tripInterests.textContent = interests;
    }
}

function getTravelerText(num) {
    if (num === 1) return "Traveler";
    if (num === 2) return "Travelers (Couple)";
    if (num <= 4) return "Travelers (Small Group)";
    return "Travelers (Large Group)";
}

// Render places in the grid
function renderPlaces(places) {
    const placesGrid = document.getElementById("placesGrid");
    const placesEmpty = document.getElementById("placesEmpty");
    
    if (!placesGrid) return;
    
    placesGrid.innerHTML = "";

    if (!places || places.length === 0) {
        if (placesEmpty) placesEmpty.style.display = "flex";
        return;
    }

    if (placesEmpty) placesEmpty.style.display = "none";
    allPlaces = places;

    places.forEach((place) => {
        const placeCard = createPlaceCard(place);
        placesGrid.appendChild(placeCard);
    });
}

// Create place card element
function createPlaceCard(place) {
    const card = document.createElement("div");
    card.className = "place-card";
    card.dataset.placeId = place.name || place.place_id || Math.random().toString(36);

    const priceLevel = place.price_level || 0;
    const priceIndicator = priceLevel > 0 ? "💰".repeat(priceLevel) : "💲";
    const rating = place.rating || "N/A";
    const reviewCount = place.user_ratings_total || 0;

    card.innerHTML = `
        <div class="place-image">
            <input type="checkbox" class="place-checkbox" onclick="event.stopPropagation()">
            ${!place.photo_url ? 
                `<div class="fallback-icon"><i class="fas fa-map-marker-alt"></i></div>` : 
                `<img src="${place.photo_url}" alt="${place.name || 'Place'}" onerror="this.parentElement.innerHTML='<div class=\\'fallback-icon\\'><i class=\\'fas fa-map-marker-alt\\'></i></div>'">`
            }
            <div class="place-rating">
                <i class="fas fa-star"></i> ${rating}
            </div>
        </div>
        <div class="place-info">
            <div class="place-name">${place.name || 'Unnamed Place'}</div>
            <div class="place-address">
                <i class="fas fa-map-marker-alt"></i> ${place.address || place.formatted_address || "Location not specified"}
            </div>
            <div class="place-types">
                ${place.types ? place.types.slice(0, 3).map(type => 
                    `<span class="place-type">${type.replace(/_/g, ' ')}</span>`
                ).join('') : ''}
            </div>
            <div class="place-stats">
                <span><i class="fas fa-users"></i> ${
                    reviewCount > 0 ? reviewCount.toLocaleString() + " reviews" : "No reviews"
                }</span>
                <span>${priceIndicator}</span>
            </div>
        </div>
    `;

    // Check if this place is already selected
    if (selectedPlaces.some(p => (p.name || p.place_id) === (place.name || place.place_id))) {
        card.classList.add("selected");
        card.querySelector(".place-checkbox").checked = true;
    }

    card.addEventListener("click", () => togglePlaceSelection(card, place));
    return card;
}

// Toggle place selection
function togglePlaceSelection(card, place) {
    const checkbox = card.querySelector(".place-checkbox");
    const isSelected = card.classList.contains("selected");
    const placeId = place.name || place.place_id;

    if (isSelected) {
        // Deselect
        card.classList.remove("selected");
        checkbox.checked = false;
        selectedPlaces = selectedPlaces.filter(p => (p.name || p.place_id) !== placeId);
    } else {
        // Select
        card.classList.add("selected");
        checkbox.checked = true;
        selectedPlaces.push(place);
    }

    updateSelectionSummary();
}

// Update selection summary
function updateSelectionSummary() {
    const summaryDiv = document.getElementById("selectionSummary");
    const countSpan = document.getElementById("selectedCount");
    
    if (!summaryDiv || !countSpan) return;
    
    countSpan.textContent = selectedPlaces.length;

    if (selectedPlaces.length > 0) {
        summaryDiv.style.display = "flex";
    } else {
        summaryDiv.style.display = "none";
    }
}

// Generate itinerary from selected places
async function generateItinerary() {
    if (selectedPlaces.length === 0) {
        showNotification('Please select at least one place to generate an itinerary', 'error');
        return;
    }

    const itineraryLoading = document.getElementById('itineraryLoading');
    const generatedItinerary = document.getElementById('generatedItinerary');
    const emptyState = document.getElementById('itineraryEmptyState');

    // Switch to itinerary tab
    const itineraryTab = document.querySelector('[data-tab="itinerary"]');
    if (itineraryTab) itineraryTab.click();

    // Show loading spinner
    if (itineraryLoading) itineraryLoading.style.display = 'flex';
    if (generatedItinerary) generatedItinerary.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';

    try {
        const itineraryData = {
            destination: tripPreferences.destination || "Unknown",
            days: tripPreferences.duration || 3,
            selected_places: selectedPlaces,
            moods: tripPreferences.moods || [],
            interests: tripPreferences.interests || [],
            travel_style: tripPreferences.travel_style || 'relaxed',
            budget: tripPreferences.budget || 'medium',
            group_size: tripPreferences.group_size || 1
        };

        const response = await fetch('/api/generate_itinerary/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(itineraryData)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            displayItinerary(data);
            showNotification('Itinerary generated successfully!', 'success');
        } else {
            throw new Error(data.message || 'Failed to generate itinerary');
        }
    } catch (error) {
        console.error('Error generating itinerary:', error);
        showNotification('Failed to generate itinerary: ' + error.message, 'error');
        if (emptyState) emptyState.style.display = 'flex';
    } finally {
        if (itineraryLoading) itineraryLoading.style.display = 'none';
    }
}

// Display generated itinerary
function displayItinerary(data) {
    const itineraryContent = document.getElementById("itineraryContent");
    const generatedItinerary = document.getElementById("generatedItinerary");
    const itineraryTripTitle = document.getElementById("itineraryTripTitle");
    const itineraryDates = document.getElementById("itineraryDates");
    const itineraryPlaces = document.getElementById("itineraryPlaces");

    if (!itineraryContent || !generatedItinerary) return;

    // Update itinerary header
    if (itineraryTripTitle) {
        itineraryTripTitle.textContent = `Your Trip to ${data.destination || tripPreferences.destination}`;
    }
    if (itineraryDates) {
        itineraryDates.textContent = `${data.days || tripPreferences.duration || 3}-day trip`;
    }
    if (itineraryPlaces) {
        itineraryPlaces.textContent = data.places_count || selectedPlaces.length;
    }

    // Display itinerary content
    const itineraryHtml = `<div style="white-space: pre-line; line-height: 1.8; font-size: 1.1rem;">${data.itinerary}</div>`;
    itineraryContent.innerHTML = itineraryHtml;
    generatedItinerary.style.display = "block";
}

// Regenerate itinerary
async function regenerateItinerary() {
    if (selectedPlaces.length === 0) {
        showNotification("Please select places to regenerate itinerary", "error");
        return;
    }

    showNotification("Regenerating your itinerary...", "info");
    await generateItinerary();
}

// Save trip
async function saveTrip() {
    try {
        const tripData = {
            destination: tripPreferences.destination,
            moods: tripPreferences.moods || [],
            interests: tripPreferences.interests || [],
            travel_style: tripPreferences.travel_style || 'relaxed',
            budget: tripPreferences.budget || 'medium',
            group_size: tripPreferences.group_size || 1,
            duration: tripPreferences.duration || 3,
            selected_places: selectedPlaces,
        };

        const response = await fetch("/api/save-trip/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie("csrftoken"),
            },
            body: JSON.stringify(tripData),
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showNotification("Trip saved successfully!", "success");
        } else {
            throw new Error(data.message || "Failed to save trip");
        }
    } catch (error) {
        console.error("Error saving trip:", error);
        showNotification("Failed to save trip: " + error.message, "error");
    }
}

// Share trip
async function shareTrip() {
    try {
        const shareData = {
            title: `Trip to ${tripPreferences.destination}`,
            text: `Check out my personalized trip to ${tripPreferences.destination}!`,
            url: window.location.href,
        };

        if (navigator.share) {
            await navigator.share(shareData);
            showNotification("Trip shared successfully!", "success");
        } else {
            // Fallback: copy to clipboard
            await navigator.clipboard.writeText(window.location.href);
            showNotification("Trip link copied to clipboard!", "success");
        }
    } catch (error) {
        console.error("Error sharing trip:", error);
        if (error.name !== 'AbortError') {
            showNotification("Failed to share trip", "error");
        }
    }
}

// Download itinerary
function downloadItinerary() {
    const itineraryContent = document.getElementById("itineraryContent");
    if (!itineraryContent || !itineraryContent.textContent.trim()) {
        showNotification("No itinerary to download. Please generate one first.", "error");
        return;
    }

    const content = itineraryContent.textContent;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tripPreferences.destination || "Trip"}_Itinerary.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification("Itinerary downloaded!", "success");
}

// Print itinerary
function printItinerary() {
    const itineraryContent = document.getElementById("itineraryContent");
    if (!itineraryContent || !itineraryContent.textContent.trim()) {
        showNotification("No itinerary to print. Please generate one first.", "error");
        return;
    }

    const printWindow = window.open("", "_blank");
    const destination = tripPreferences.destination || "Unknown";
    const duration = tripPreferences.duration || 3;
    const groupSize = tripPreferences.group_size || 1;
    
    printWindow.document.write(`
        <html>
            <head>
                <title>Trip Itinerary - ${destination}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                    h1 { color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
                    .header { margin-bottom: 30px; }
                    .content { white-space: pre-line; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Trip Itinerary - ${destination}</h1>
                    <p><strong>Duration:</strong> ${duration} days</p>
                    <p><strong>Travelers:</strong> ${groupSize}</p>
                </div>
                <div class="content">${itineraryContent.textContent}</div>
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Refresh recommendations
async function refreshRecommendations() {
    showNotification("Refreshing recommendations...", "info");
    await loadRecommendedPlaces();
}

// Initialize tabs
function initializeTabs() {
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabContents = document.querySelectorAll(".tab-content");

    tabButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const tabId = button.getAttribute("data-tab");

            // Remove active class from all buttons and contents
            tabButtons.forEach((btn) => btn.classList.remove("active"));
            tabContents.forEach((content) => content.classList.remove("active"));

            // Add active class to clicked button and corresponding content
            button.classList.add("active");
            const targetContent = document.getElementById(tabId);
            if (targetContent) targetContent.classList.add("active");
        });
    });
}

// Show notification
function showNotification(message, type = "info") {
    // Remove existing notification if any
    const existingNotification = document.querySelector(".notification");
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    
    const icon = type === "success" ? "fas fa-check-circle" : 
                 type === "error" ? "fas fa-exclamation-circle" : 
                 "fas fa-info-circle";
    
    notification.innerHTML = `
        <i class="${icon}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => notification.classList.add("show"), 100);

    // Hide notification after 4 seconds
    setTimeout(() => {
        notification.classList.remove("show");
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 4000);
}

// Get CSRF token
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === name + "=") {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Handle window resize for responsive design
window.addEventListener("resize", () => {
    const placesGrid = document.getElementById("placesGrid");
    if (placesGrid) {
        if (window.innerWidth < 768) {
            placesGrid.style.gridTemplateColumns = "1fr";
        } else {
            placesGrid.style.gridTemplateColumns = "repeat(auto-fill, minmax(320px, 1fr))";
        }
    }
});

// Handle offline status
window.addEventListener("online", () => {
    showNotification("Connection restored!", "success");
});

window.addEventListener("offline", () => {
    showNotification("You're offline. Some features may not work.", "error");
});

// Make functions globally available for onclick handlers
window.generateItinerary = generateItinerary;
window.regenerateItinerary = regenerateItinerary;
window.downloadItinerary = downloadItinerary;
window.printItinerary = printItinerary;
window.refreshRecommendations = refreshRecommendations;
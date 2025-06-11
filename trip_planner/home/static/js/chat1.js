document.addEventListener('DOMContentLoaded', function() {
    // Chat elements
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    
    // Enhanced chat state management
    const chatState = {
        currentStep: 'intro',
        tripData: {
            source: '',
            destination: '',
            travel_date: '',
            duration: '',
            num_travelers: 1,
            traveler_type: '',
            moods: [],
            transport_type: '',
            accommodation: '',
            budget: '',
            route_preference: '',
            weather_preference: '',
            show_popular: false,
            save_preferences: false
        },
        waitingForUserInput: false,
        progress: 0,
        inputCallback: null,
        dynamicData: {
            minBudget: 0,
            maxBudget: 10000,
            transportOptions: [],
            accommodationSuggestions: []
        }
    };
    
    // Enhanced icons with better organization
    const icons = {
        solo: '<i class="fas fa-user fa-2x text-primary"></i>',
        couple: '<i class="fas fa-heart fa-2x text-danger"></i>',
        family: '<i class="fas fa-users fa-2x text-success"></i>',
        friends: '<i class="fas fa-user-friends fa-2x text-info"></i>',
        business: '<i class="fas fa-briefcase fa-2x text-warning"></i>',
        
        chill: '<i class="fas fa-spa fa-2x text-info"></i>',
        adventure: '<i class="fas fa-mountain fa-2x text-success"></i>',
        food: '<i class="fas fa-utensils fa-2x text-warning"></i>',
        peace: '<i class="fas fa-leaf fa-2x text-success"></i>',
        culture: '<i class="fas fa-landmark fa-2x text-purple"></i>',
        instagram: '<i class="fas fa-camera fa-2x text-pink"></i>',
        nature: '<i class="fas fa-tree fa-2x text-success"></i>',
        nightlife: '<i class="fas fa-cocktail fa-2x text-danger"></i>',
        
        car: '<i class="fas fa-car fa-2x text-primary"></i>',
        flight: '<i class="fas fa-plane fa-2x text-info"></i>',
        train: '<i class="fas fa-train fa-2x text-success"></i>',
        bus: '<i class="fas fa-bus fa-2x text-warning"></i>',
        mixed: '<i class="fas fa-random fa-2x text-secondary"></i>',
        
        budget: '<i class="fas fa-bed fa-2x text-success"></i>',
        mid: '<i class="fas fa-hotel fa-2x text-warning"></i>',
        luxury: '<i class="fas fa-concierge-bell fa-2x text-danger"></i>',
        
        scenic: '<i class="fas fa-mountain fa-2x text-success"></i>',
        fastest: '<i class="fas fa-tachometer-alt fa-2x text-primary"></i>',
        flexible: '<i class="fas fa-exchange-alt fa-2x text-info"></i>',
        
        sunny: '<i class="fas fa-sun fa-2x text-warning"></i>',
        no_rain: '<i class="fas fa-cloud-sun fa-2x text-info"></i>',
        cold: '<i class="fas fa-snowflake fa-2x text-primary"></i>',
        any: '<i class="fas fa-cloud-sun-rain fa-2x text-secondary"></i>'
    };
    
    // Dynamic chat flow with conditional logic
    const chatFlow = {
        intro: {
            message: "🌟 Welcome to your personalized travel planning assistant! I'll help you create the perfect trip tailored to your preferences. Ready to start your journey?",
            options: [
                { text: "Let's plan my trip!", value: 'start', emoji: '✈️' }
            ],
            nextStep: 'source'
        },
        
        source: {
            message: "Great! Let's start with the basics. 📍 Where will your journey begin? Please enter your departure city or location:",
            input: true,
            handler: (value) => {
                chatState.tripData.source = value.trim();
                updateProgress(8);
                return 'destination';
            }
        },
        
        destination: {
            message: "Perfect! Now, where would you like to explore? 🗺️ Enter your dream destination:",
            input: true,
            handler: (value) => {
                chatState.tripData.destination = value.trim();
                updateProgress(16);
                // Fetch dynamic data based on destination
                fetchDestinationData(value);
                return 'travel_date';
            }
        },
        
        travel_date: {
            message: "When are you planning to travel? 📅 You can specify dates, a month, season, or just say 'flexible':",
            input: true,
            handler: (value) => {
                chatState.tripData.travel_date = value.trim();
                updateProgress(24);
                return 'duration';
            }
        },
        
        duration: {
            message: "How long will your adventure last? ⏳ Please specify the number of days (e.g., '5 days', '1 week', '2 weeks'):",
            input: true,
            handler: (value) => {
                chatState.tripData.duration = value.trim();
                updateProgress(32);
                return 'traveler_type';
            }
        },
        
        traveler_type: {
            message: "What type of trip are you planning? This helps me customize everything perfectly:",
            options: [
                { text: "Solo Adventure", value: 'solo', icon: icons.solo, description: "Just me, myself, and I" },
                { text: "Romantic Getaway", value: 'couple', icon: icons.couple, description: "For two lovebirds" },
                { text: "Family Trip", value: 'family', icon: icons.family, description: "Multiple generations together" },
                { text: "Friends Group", value: 'friends', icon: icons.friends, description: "Squad goals activated" },
                { text: "Business Travel", value: 'business', icon: icons.business, description: "Work meets wanderlust" }
            ],
            handler: (value) => {
                chatState.tripData.traveler_type = value;
                updateProgress(40);
                
                // Dynamic flow: Ask for number of travelers only if not solo
                if (value === 'solo') {
                    chatState.tripData.num_travelers = 1;
                    return 'transport';
                }
                else if (value === 'couple') {
                    chatState.tripData.num_travelers = 2;
                    return 'transport';
                } else {
                    return 'travelers_count';
                }
            }
        },
        
        travelers_count: {
            message: () => {
                const type = chatState.tripData.traveler_type;
                const messages = {
                    family: "How many family members will be traveling together? 👨‍👩‍👧‍👦",
                    friends: "How many friends are joining this adventure? 👫👬👭",
                    business: "How many colleagues will be traveling? 💼"
                };
                return messages[type] || "How many travelers in total?";
            },
            input: true,
            inputType: 'number',
            handler: (value) => {
                const count = parseInt(value);
                if (count < 1 || count > 50) {
                    addSystemMessage("Please enter a valid number between 1 and 50.");
                    return 'travelers_count';
                }
                chatState.tripData.num_travelers = count;
                updateProgress(48);
                return 'transport';
            }
        },
        
        transport: {
            message: "How would you prefer to travel? ✈️🚗🚆 This affects budget and experience recommendations:",
            options: () => {
                // Dynamic transport options based on destination distance
                const baseOptions = [
                    { text: "Flight", value: 'flight', icon: icons.flight, description: "Fast and convenient" },
                    { text: "Personal Vehicle", value: 'car', icon: icons.car, description: "Freedom to explore" },
                    { text: "Train", value: 'train', icon: icons.train, description: "Scenic and relaxing" },
                    { text: "Bus/Coach", value: 'bus', icon: icons.bus, description: "Budget-friendly option" },
                    { text: "Mixed Transport", value: 'mixed', icon: icons.mixed, description: "Combine different modes" }
                ];
                
                // Filter options based on route feasibility
                return baseOptions; // In real implementation, filter based on source/destination
            },
            handler: (value) => {
                chatState.tripData.transport_type = value;
                updateProgress(56);
                
                // Set dynamic budget constraints based on transport
                setBudgetConstraints(value);
                return 'moods';
            }
        },
        
        moods: {
            message: "What kind of experiences are calling to you? ✨ Select all that resonate with your travel dreams:",
            multiOptions: [
                { text: "Relaxation & Wellness", value: 'chill', icon: icons.chill, description: "Spa days and zen vibes" },
                { text: "Adventure & Thrills", value: 'adventure', icon: icons.adventure, description: "Adrenaline and excitement" },
                { text: "Culinary Journey", value: 'food', icon: icons.food, description: "Taste the world" },
                { text: "Peace & Mindfulness", value: 'peace', icon: icons.peace, description: "Inner harmony" },
                { text: "Cultural Immersion", value: 'culture', icon: icons.culture, description: "Local traditions" },
                { text: "Instagram Worthy", value: 'instagram', icon: icons.instagram, description: "Picture perfect moments" },
                { text: "Nature & Outdoors", value: 'nature', icon: icons.nature, description: "Wild and wonderful" },
                { text: "Nightlife & Entertainment", value: 'nightlife', icon: icons.nightlife, description: "After dark adventures" }
            ],
            confirmBtn: "These are my vibes! ✨",
            handler: (values) => {
                if (values.length === 0) {
                    addSystemMessage("Please select at least one experience type to continue.");
                    return 'moods';
                }
                chatState.tripData.moods = values;
                updateProgress(64);
                return 'accommodation';
            }
        },
        
        accommodation: {
            message: () => {
                const type = chatState.tripData.traveler_type;
                const messages = {
                    solo: "What type of accommodation fits your solo adventure style? 🏨",
                    couple: "Where would you like to stay for your romantic getaway? 💕",
                    family: "What accommodation works best for your family? 👨‍👩‍👧‍👦",
                    friends: "Where should your squad crash for the night? 🏠",
                    business: "What type of accommodation do you need for business travel? 💼"
                };
                return messages[type] || "What type of accommodation do you prefer?";
            },
            options: () => {
                // Dynamic accommodation options based on group type
                const baseOptions = [
                    { text: "Budget-Friendly", value: 'budget', icon: icons.budget, description: "Great value options" },
                    { text: "Comfortable Mid-Range", value: 'mid', icon: icons.mid, description: "Perfect balance" },
                    { text: "Luxury Experience", value: 'luxury', icon: icons.luxury, description: "Premium comfort" }
                ];
                
                // Add group-specific options
                if (chatState.tripData.traveler_type === 'family') {
                    baseOptions.forEach(option => {
                        if (option.value === 'budget') option.description = "Family-friendly hostels, apartments";
                        if (option.value === 'mid') option.description = "Family hotels, vacation rentals";
                        if (option.value === 'luxury') option.description = "Resort suites, luxury villas";
                    });
                }
                
                return baseOptions;
            },
            handler: (value) => {
                chatState.tripData.accommodation = value;
                updateProgress(72);
                return 'budget';
            }
        },
        
        budget: {
            message: () => {
                const transport = chatState.tripData.transport_type;
                const travelers = chatState.tripData.num_travelers;
                const minBudget = chatState.dynamicData.minBudget;
                
                let message = `What's your budget range per person? 💰 `;
                
                if (transport === 'flight') {
                    message += `\n\n✈️ Flight estimates: $${minBudget}-${minBudget * 3} per person`;
                } else if (transport === 'car') {
                    message += `\n\n🚗 Fuel + tolls estimate: $${Math.round(minBudget/2)}-${minBudget} total for ${travelers} travelers`;
                }
                
                message += `\n\nYou can enter an amount (e.g., '$1500') or say 'flexible' for suggestions across all ranges.`;
                
                return message;
            },
            input: true,
            handler: (value) => {
                chatState.tripData.budget = value.trim();
                updateProgress(80);
                return 'route_preference';
            }
        },
        
        route_preference: {
            message: "How do you like to journey? 🛤️ Your travel style shapes the experience:",
            options: [
                { text: "Scenic Routes", value: 'scenic', icon: icons.scenic, description: "Beautiful views, memorable stops" },
                { text: "Efficient Travel", value: 'fastest', icon: icons.fastest, description: "Get there quickly" },
                { text: "I'm Flexible", value: 'flexible', icon: icons.flexible, description: "Best overall experience" }
            ],
            handler: (value) => {
                chatState.tripData.route_preference = value;
                updateProgress(88);
                return 'weather_preference';
            }
        },
        
        weather_preference: {
            message: "Any weather preferences for your trip? 🌤️ This helps with timing and packing suggestions:",
            options: [
                { text: "Sunny & Warm", value: 'sunny', icon: icons.sunny, description: "Perfect beach weather" },
                { text: "Avoid Rain", value: 'no_rain', icon: icons.no_rain, description: "Keep me dry" },
                { text: "Cool & Crisp", value: 'cold', icon: icons.cold, description: "Sweater weather" },
                { text: "Any Weather", value: 'any', icon: icons.any, description: "I'm adaptable" }
            ],
            handler: (value) => {
                chatState.tripData.weather_preference = value;
                updateProgress(94);
                return 'final_preferences';
            }
        },
        
        final_preferences: {
            message: "Last couple of quick questions to perfect your recommendations! 🎯",
            options: [
                { text: "Include popular tourist spots", value: 'popular', emoji: '🏛️' },
                { text: "Show me hidden gems", value: 'hidden', emoji: '💎' },
                { text: "Mix of both", value: 'mixed', emoji: '🌟' }
            ],
            handler: (value) => {
                chatState.tripData.show_popular = (value === 'popular' || value === 'mixed');
                updateProgress(97);
                return 'save_preference';
            }
        },
        
        save_preference: {
            message: "Would you like to save these preferences for future trip planning? 💾",
            options: [
                { text: "Yes, save my profile", value: true, emoji: '✅' },
                { text: "Just for this trip", value: false, emoji: '🎯' }
            ],
            handler: (value) => {
                chatState.tripData.save_preferences = value;
                updateProgress(100);
                return 'summary';
            }
        },
        
        summary: {
            message: () => {
                const data = chatState.tripData;
                return `🎉 Perfect! I'm now crafting your personalized travel recommendations for ${data.destination}!

                        📋 Your Trip Summary:
                        • ${data.source} → ${data.destination}
                        • ${data.duration} in ${data.travel_date}
                        • ${data.num_travelers} ${data.traveler_type} traveler${data.num_travelers > 1 ? 's' : ''}
                        • Transport: ${data.transport_type}
                        • Vibes: ${data.moods.join(', ')}
                        • Budget: ${data.budget}

                        ✨ Generating your perfect itinerary...`;
            },
            handler: () => {
                setTimeout(() => {
                    saveTripData()
                        .then(response => {
                            if (response.success) {
                                processStep('recommendations');
                            } else {
                                addSystemMessage("Let me try generating your recommendations again...");
                                setTimeout(() => processStep('recommendations'), 1000);
                            }
                        })
                        .catch(error => {
                            console.error('Error saving trip:', error);
                            processStep('recommendations'); // Continue anyway
                        });
                }, 2000);
                return null;
            }
        },
        
        recommendations: {
            message: "🌟 Here are your personalized travel recommendations! Each suggestion is tailored to your preferences and travel style.",
            handler: () => {
                getRecommendations()
                    .then(response => {
                        if (response.success) {
                            displayRecommendations(response.recommendations);
                            addBotMessage("🎊 Your perfect trip awaits! Need any adjustments or have questions about these recommendations? I'm here to help!");
                        } else {
                            displayFallbackRecommendations();
                        }
                    })
                    .catch(error => {
                        console.error('Error getting recommendations:', error);
                        displayFallbackRecommendations();
                    });
                return null;
            }
        }
    };

    // Initialize chat
    // startChat();

    function startChat() {
        chatMessages.innerHTML = '';
        addBotMessage(chatFlow.intro.message);

        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'options-container animate__animated animate__fadeInUp';

        const grid = document.createElement('div');
        grid.className = 'options-grid';

        chatFlow.intro.options.forEach(option => {
            const optionCard = document.createElement('div');
            optionCard.className = 'option-card';
            optionCard.dataset.value = option.value;
            optionCard.innerHTML = `
                <div class="option-header">
                    ${option.emoji ? `<div class="option-icon"><span style="font-size: 24px;">${option.emoji}</span></div>` : ''}
                    <div class="option-text">${option.text}</div>
                </div>
            `;
            optionCard.addEventListener('click', function () {
                addUserMessage(option.text);
                setTimeout(() => {
                    optionsContainer.remove();
                    processStep(chatFlow.intro.nextStep);
                }, 500);
            });
            grid.appendChild(optionCard);
        });

        optionsContainer.appendChild(grid);
        chatMessages.appendChild(optionsContainer);
        scrollToBottom();

        // Show input box and send button
        chatInput.style.display = 'block';
        sendBtn.style.display = 'inline-block';
    }

    function initChat() {
        const chatMessages = document.getElementById('chat-messages');
        const chatInput = document.getElementById('chat-input');
        const sendBtn = document.getElementById('send-btn');

        // 1. Create and insert progress bar at the top
        const progressBarContainer = document.createElement('div');
        progressBarContainer.className = 'progress-container mb-4';
        progressBarContainer.id = 'progress-bar-container';
        progressBarContainer.innerHTML = `
            <div class="progress-wrapper">
                <div class="progress-track">
                    <div class="progress-bar" style="width: 0%">
                        <div class="progress-glow"></div>
                    </div>
                </div>
                <div class="progress-text">0% Complete</div>
            </div>
        `;
        chatMessages.parentNode.insertBefore(progressBarContainer, chatMessages);

        // 2. Hide input and send button initially
        chatInput.style.display = 'none';
        sendBtn.style.display = 'none';

        // 3. Create "Let's plan my trip!" button
        const startButton = document.createElement('button');
        startButton.id = 'start-chat-button';
        startButton.className = 'btn btn-primary btn-lg mt-3 mb-4 d-block mx-auto';
        startButton.textContent = "Let's plan my trip! 🚀";
        startButton.setAttribute('aria-label', 'Start planning your trip');

        // Insert button after the initial bot message container
        chatMessages.insertAdjacentElement('afterend', startButton);

        // 4. Add event listener for the start button
        startButton.addEventListener('click', () => {
            // Hide the button
            startButton.style.display = 'none';

            // Show input and send button
            chatInput.style.display = 'block';
            sendBtn.style.display = 'inline-block';

            // Start the chat process
            startChat();
        });

        // Expose startChat globally if needed
        window.startChat = startChat;
    }

    initChat();

    // Enhanced progress bar with animations
    // function updateProgress(percent) {
    //     chatState.progress = percent;
        
    //     let progressContainer = document.querySelector('.progress-container');
    //     if (!progressContainer) {
    //         progressContainer = document.createElement('div');
    //         progressContainer.className = 'progress-container mb-4';
    //         progressContainer.innerHTML = `
    //             <div class="progress-wrapper">
    //                 <div class="progress-track">
    //                     <div class="progress-bar" style="width: 0%">
    //                         <div class="progress-glow"></div>
    //                     </div>
    //                 </div>
    //                 <div class="progress-text">${percent}% Complete</div>
    //             </div>
    //             <style>
    //                 .progress-wrapper {
    //                     position: relative;
    //                     margin: 20px 0;
    //                 }
    //                 .progress-track {
    //                     height: 8px;
    //                     background: linear-gradient(90deg, #f0f0f0 0%, #e0e0e0 100%);
    //                     border-radius: 20px;
    //                     overflow: hidden;
    //                     box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
    //                 }
    //                 .progress-bar {
    //                     height: 100%;
    //                     background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    //                     border-radius: 20px;
    //                     transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    //                     position: relative;
    //                     overflow: hidden;
    //                 }
    //                 .progress-glow {
    //                     position: absolute;
    //                     top: 0;
    //                     left: -100%;
    //                     width: 100%;
    //                     height: 100%;
    //                     background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    //                     animation: shimmer 2s infinite;
    //                 }
    //                 .progress-text {
    //                     text-align: center;
    //                     margin-top: 8px;
    //                     font-size: 12px;
    //                     color: #666;
    //                     font-weight: 500;
    //                 }
    //                 @keyframes shimmer {
    //                     0% { left: -100%; }
    //                     100% { left: 100%; }
    //                 }
    //             </style>
    //         `;
    //         chatMessages.appendChild(progressContainer);
    //     }
        
    //     const progressBar = progressContainer.querySelector('.progress-bar');
    //     const progressText = progressContainer.querySelector('.progress-text');
        
    //     if (progressBar && progressText) {
    //         progressBar.style.width = `${percent}%`;
    //         progressText.textContent = `${percent}% Complete`;
            
    //         if (percent === 100) {
    //             progressText.textContent = "🎉 Planning Complete!";
    //             progressText.style.color = "#667eea";
    //             progressText.style.fontWeight = "600";
    //         }
    //     }
        
    //     scrollToBottom();
    // }

    function updateProgress(percent) {
        const progressBar = document.querySelector('.progress-bar');
        const progressText = document.querySelector('.progress-text');
        if (progressBar && progressText) {
            progressBar.style.width = `${percent}%`;
            progressText.textContent = `${percent}% Complete`;
            if (percent === 100) {
                progressText.textContent = "🎉 Planning Complete!";
                progressText.style.color = "#667eea";
                progressText.style.fontWeight = "600";
            }
        }
        scrollToBottom();
    }

    // Dynamic data fetching functions
    function fetchDestinationData(destination) {
        // In real implementation, this would call APIs to get:
        // - Flight prices from source to destination
        // - Local transportation costs
        // - Accommodation price ranges
        // - Weather patterns
        // For now, simulate with reasonable estimates
        
        const estimates = estimateCosts(destination);
        chatState.dynamicData.minBudget = estimates.minBudget;
        chatState.dynamicData.maxBudget = estimates.maxBudget;
    }
    
    function estimateCosts(destination) {
        // Simplified cost estimation - in reality, use APIs like Skyscanner, Booking.com
        const baseCosts = {
            domestic: { minBudget: 200, maxBudget: 2000 },
            international: { minBudget: 500, maxBudget: 5000 },
            exotic: { minBudget: 1000, maxBudget: 8000 }
        };
        
        // Simple heuristic based on destination
        const lower = destination.toLowerCase();
        if (lower.includes('japan') || lower.includes('switzerland') || lower.includes('norway')) {
            return baseCosts.exotic;
        } else if (lower.includes('europe') || lower.includes('asia') || lower.includes('africa')) {
            return baseCosts.international;
        } else {
            return baseCosts.domestic;
        }
    }
    
    function setBudgetConstraints(transport) {
        // Adjust minimum budget based on transport choice
        const multipliers = {
            flight: 1.5,
            car: 0.7,
            train: 1.2,
            bus: 0.5,
            mixed: 1.0
        };
        
        const multiplier = multipliers[transport] || 1.0;
        chatState.dynamicData.minBudget *= multiplier;
    }

    // Enhanced message functions with better animations
    // function addBotMessage(message, delay = 500) {
    //     // Handle function messages
    //     if (typeof message === 'function') {
    //         message = message();
    //     }
        
    //     const typingIndicator = document.createElement('div');
    //     typingIndicator.className = 'chat-bubble bot typing-indicator';
    //     typingIndicator.innerHTML = `
    //         <div class="typing-animation">
    //             <span></span><span></span><span></span>
    //         </div>
    //         <style>
    //             .typing-animation {
    //                 display: flex;
    //                 gap: 4px;
    //                 padding: 8px 0;
    //             }
    //             .typing-animation span {
    //                 width: 8px;
    //                 height: 8px;
    //                 border-radius: 50%;
    //                 background: #667eea;
    //                 animation: typing 1.4s infinite ease-in-out;
    //             }
    //             .typing-animation span:nth-child(2) { animation-delay: 0.2s; }
    //             .typing-animation span:nth-child(3) { animation-delay: 0.4s; }
    //             @keyframes typing {
    //                 0%, 60%, 100% { transform: scale(0.8); opacity: 0.5; }
    //                 30% { transform: scale(1.2); opacity: 1; }
    //             }
    //         </style>
    //     `;
    //     chatMessages.appendChild(typingIndicator);
    //     scrollToBottom();
        
    //     setTimeout(() => {
    //         if (typingIndicator.parentNode) {
    //             chatMessages.removeChild(typingIndicator);
    //         }
            
    //         const msgElement = document.createElement('div');
    //         msgElement.className = 'chat-bubble bot animate__animated animate__fadeInUp';
    //         msgElement.style.whiteSpace = 'pre-line'; // Preserve line breaks
    //         msgElement.innerHTML = message;
    //         chatMessages.appendChild(msgElement);
    //         scrollToBottom();
    //     }, delay);
    // }
    function addBotMessage(message) {
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'chat-bubble bot typing-indicator';
        typingIndicator.innerHTML = `
            <div class="typing-animation">
                <span></span><span></span><span></span>
            </div>
        `;
        chatMessages.appendChild(typingIndicator);
        scrollToBottom();

        setTimeout(() => {
            if (typingIndicator.parentNode) {
                chatMessages.removeChild(typingIndicator);
            }
            const msgElement = document.createElement('div');
            msgElement.className = 'chat-bubble bot animate__animated animate__fadeInUp';
            msgElement.style.whiteSpace = 'pre-line';
            msgElement.innerHTML = message;
            chatMessages.appendChild(msgElement);
            scrollToBottom();
        }, 500);
    }


    // Enhanced options display with better styling
    // function addOptions(options, callback) {
    //     // Handle function options
    //     if (typeof options === 'function') {
    //         options = options();
    //     }
        
    //     const container = document.createElement('div');
    //     container.className = 'options-container animate__animated animate__fadeInUp';
    //     container.innerHTML = `
    //         <style>
    //             .options-grid {
    //                 display: grid;
    //                 grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    //                 gap: 12px;
    //                 margin: 15px 0;
    //             }
    //             .option-card {
    //                 background: white;
    //                 border: 2px solid #e1e5e9;
    //                 border-radius: 12px;
    //                 padding: 16px;
    //                 cursor: pointer;
    //                 transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    //                 box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    //             }
    //             .option-card:hover {
    //                 border-color: #667eea;
    //                 transform: translateY(-2px);
    //                 box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
    //             }
    //             .option-card.selected {
    //                 border-color: #667eea;
    //                 background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    //                 color: white;
    //                 transform: scale(1.02);
    //             }
    //             .option-header {
    //                 display: flex;
    //                 align-items: center;
    //                 gap: 12px;
    //                 margin-bottom: 8px;
    //             }
    //             .option-icon {
    //                 flex-shrink: 0;
    //             }
    //             .option-text {
    //                 font-weight: 600;
    //                 font-size: 16px;
    //             }
    //             .option-description {
    //                 font-size: 14px;
    //                 opacity: 0.8;
    //                 margin-top: 4px;
    //             }
    //         </style>
    //         <div class="options-grid"></div>
    //     `;
        
    //     const grid = container.querySelector('.options-grid');
        
    //     options.forEach(option => {
    //         const optionCard = document.createElement('div');
    //         optionCard.className = 'option-card';
    //         optionCard.dataset.value = option.value;
            
    //         optionCard.innerHTML = `
    //             <div class="option-header">
    //                 ${option.icon ? `<div class="option-icon">${option.icon}</div>` : 
    //                   option.emoji ? `<div class="option-icon"><span style="font-size: 24px;">${option.emoji}</span></div>` : ''}
    //                 <div class="option-text">${option.text}</div>
    //             </div>
    //             ${option.description ? `<div class="option-description">${option.description}</div>` : ''}
    //         `;
            
    //         optionCard.addEventListener('click', function(e) {
    //             e.preventDefault();
    //             e.stopPropagation();
                
    //             // Visual feedback
    //             const allOptions = container.querySelectorAll('.option-card');
    //             allOptions.forEach(opt => opt.classList.remove('selected'));
    //             optionCard.classList.add('selected');
                
    //             // Add user message
    //             addUserMessage(option.text);
                
    //             // Remove options and continue
    //             setTimeout(() => {
    //                 if (container.parentNode) {
    //                     container.remove();
    //                 }
    //                 if (callback) callback(option.value);
    //             }, 500);
    //         });
            
    //         grid.appendChild(optionCard);
    //     });
        
    //     chatMessages.appendChild(container);
    //     scrollToBottom();
    // }
    function addOptions(options, callback) {
        const container = document.createElement('div');
        container.className = 'options-container animate__animated animate__fadeInUp';
        container.innerHTML = `<div class="options-grid"></div>`;
        const grid = container.querySelector('.options-grid');

        options.forEach(option => {
            const optionCard = document.createElement('div');
            optionCard.className = 'option-card';
            optionCard.dataset.value = option.value;
            optionCard.innerHTML = `
                <div class="option-header">
                    ${option.icon ? `<div class="option-icon">${option.icon}</div>` : 
                      option.emoji ? `<div class="option-icon"><span style="font-size: 24px;">${option.emoji}</span></div>` : ''}
                    <div class="option-text">${option.text}</div>
                </div>
                ${option.description ? `<div class="option-description">${option.description}</div>` : ''}
            `;
            optionCard.addEventListener('click', function () {
                addUserMessage(option.text);
                const allOptions = container.querySelectorAll('.option-card');
                allOptions.forEach(opt => opt.classList.remove('selected'));
                optionCard.classList.add('selected');
                setTimeout(() => {
                    container.remove();
                    callback(option.value);
                }, 500);
            });
            grid.appendChild(optionCard);
        });

        chatMessages.appendChild(container);
        scrollToBottom();
    }

    // Event listeners
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && chatInput.value.trim() !== '') {
            handleUserInput();
        }
    });

    sendBtn.addEventListener('click', function() {
        if (chatInput.value.trim() !== '') {
            handleUserInput();
        }
    });

    // function startChat() {
    //     chatMessages.innerHTML = '';
    //     chatState.currentStep = 'intro';
    //     chatState.tripData = {
    //         source: '',
    //         destination: '',
    //         travel_date: '',
    //         duration: '',
    //         num_travelers: 0,
    //         traveler_type: '',
    //         moods: [],
    //         transport_type: '',
    //         accommodation: '',
    //         budget: '',
    //         route_preference: '',
    //         weather_preference: '',
    //         show_popular: false,
    //         save_preferences: false
    //     };
    //     chatState.waitingForUserInput = false;

    //     chatInput.disabled = false;
    //     sendBtn.disabled = false;
    //     chatInput.focus();
        
    //     processStep('intro');
    // }

    

    function processStep(stepName) {
        chatState.currentStep = stepName;
        
        const step = chatFlow[stepName];
        if (!step) {
            console.error(`Step "${stepName}" not found in chat flow`);
            return;
        }
        
        let message = step.message;
        if (typeof message === 'string') {
            if (message.includes('{{destination}}')) {
                message = message.replace('{{destination}}', chatState.tripData.destination);
            }
            if (message.includes('{{mood}}')) {
                const primaryMood = chatState.tripData.moods && chatState.tripData.moods.length > 0 ? 
                    chatState.tripData.moods[0] : 'adventure';
                message = message.replace('{{mood}}', primaryMood);
            }
        }
        
        addBotMessage(message);
        
        if (step.options) {
            addOptions(step.options, (value) => {
                if (step.handler) {
                    const nextStep = step.handler(value);
                    if (nextStep) processStep(nextStep);
                } else if (step.nextStep) {
                    processStep(step.nextStep);
                }
            });
        }
        else if (step.multiOptions) {
            addMultiOptions(step.multiOptions, step.confirmBtn, (values) => {
                if (step.handler) {
                    const nextStep = step.handler(values);
                    if (nextStep) processStep(nextStep);
                } else if (step.nextStep) {
                    processStep(step.nextStep);
                }
            });
        }
        else if (step.input) {
            enableUserInput((value) => {
                addUserMessage(value);
                if (step.handler) {
                    const nextStep = step.handler(value);
                    if (nextStep) processStep(nextStep);
                } else if (step.nextStep) {
                    processStep(step.nextStep);
                }
            }, step.inputType);
        }
        else if (step.handler) {
            const nextStep = step.handler();
            if (nextStep) processStep(nextStep);
        }
    }

    function addUserMessage(message) {
        const msgElement = document.createElement('div');
        msgElement.className = 'chat-bubble user animate__animated animate__fadeIn';
        msgElement.innerText = message;
        chatMessages.appendChild(msgElement);
        scrollToBottom();
    }

    function addSystemMessage(message) {
        const msgElement = document.createElement('div');
        msgElement.className = 'chat-bubble system animate__animated animate__fadeIn';
        msgElement.innerText = message;
        chatMessages.appendChild(msgElement);
        scrollToBottom();
    }

    function addMultiOptions(options, confirmBtnText, callback) {
        const container = document.createElement('div');
        container.className = 'multi-options-container animate__animated animate__fadeInUp';
        container.innerHTML = `
            <style>
                .multi-options-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 10px;
                    margin-bottom: 15px;
                }
                .multi-option {
                    background: white;
                    border: 2px solid #e1e5e9;
                    border-radius: 10px;
                    padding: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .multi-option:hover {
                    border-color: #667eea;
                }
                .multi-option.selected {
                    background: #667eea;
                    color: white;
                    border-color: #667eea;
                }
                .multi-option .option-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
            </style>
            <div class="multi-options-grid"></div>
        `;
        
        const grid = container.querySelector('.multi-options-grid');
        
        options.forEach(option => {
            const optionElement = document.createElement('div');
            optionElement.className = 'multi-option';
            optionElement.dataset.value = option.value;
            
            optionElement.innerHTML = `
                <div class="option-header">
                    ${option.icon ? `<div class="option-icon">${option.icon}</div>` : ''}
                    <div class="option-text">${option.text}</div>
                </div>
                ${option.description ? `<div class="option-description">${option.description}</div>` : ''}
            `;
            
            optionElement.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                optionElement.classList.toggle('selected');
            });
            
            grid.appendChild(optionElement);
        });
        
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'btn btn-primary w-100 mt-3';
        confirmBtn.innerText = confirmBtnText || 'Confirm Selection';
        confirmBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const selectedOptions = container.querySelectorAll('.multi-option.selected');
            const values = Array.from(selectedOptions).map(opt => opt.dataset.value);
            
            if (values.length === 0) {
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        title: 'Oops!',
                        text: 'Please select at least one option',
                        icon: 'warning',
                        confirmButtonColor: '#6C63FF'
                    });
                } else {
                    alert('Please select at least one option');
                }
                return;
            }
            
            const selectedText = Array.from(selectedOptions)
                .map(opt => opt.querySelector('.option-text').innerText)
                .join(', ');
            addUserMessage(`Selected: ${selectedText}`);
            
            setTimeout(() => {
                if (container && container.parentNode) {
                    container.remove();
                }
                if (callback) callback(values);
            }, 500);
        });
        
        container.appendChild(confirmBtn);
        chatMessages.appendChild(container);
        scrollToBottom();
    }

    function enableUserInput(callback, inputType = 'text') {
        chatState.waitingForUserInput = true;
        chatInput.disabled = false;
        chatInput.value = '';
        chatInput.focus();
        chatInput.type = inputType || 'text';
        sendBtn.disabled = false;
        chatState.inputCallback = callback;
    }

    function handleUserInput() {
        if (!chatState.waitingForUserInput) return;
        
        const value = chatInput.value.trim();
        if (value === '') return;
        
        chatInput.value = '';
        chatInput.disabled = true;
        sendBtn.disabled = true;
        chatState.waitingForUserInput = false;
        
        const callback = chatState.inputCallback;
        chatState.inputCallback = null;
        
        if (callback) {
            callback(value);
        }
    }

    function scrollToBottom() {
        setTimeout(() => {
            if (chatMessages) {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        }, 100);
    }

    async function saveTripData() {
        try {
            const response = await fetch('/api/save-trip/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken(),
                },
                credentials: 'include',
                body: JSON.stringify(chatState.tripData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to save trip data');
            }
            
            const data = await response.json();
            return {
                success: true,
                trip_id: data.trip_id
            };
        } catch (error) {
            console.error('Error saving trip:', error);
            return { success: false };
        }
    }

    function getCSRFToken() {
        const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1];
        return cookieValue || '';
    }
    
    async function getRecommendations() {
    try {
        const response = await fetch('/api/get_recommendations/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken(),
            },
            body: JSON.stringify({
                destination: chatState.tripData.destination,
                moods: chatState.tripData.moods,
                traveler_type: chatState.tripData.traveler_type,
                budget: chatState.tripData.budget,
                transport_type: chatState.tripData.transport_type,
                accommodation: chatState.tripData.accommodation,
                route_preference: chatState.tripData.route_preference,
                weather_preference: chatState.tripData.weather_preference,
                show_popular: chatState.tripData.show_popular
            }),
        });

        if (!response.ok) {
            // Silently fall back to default recommendations
            return {
                success: false,
                recommendations: getFallbackRecommendations()
            };
        }

        const data = await response.json();
        
        if (data.redirect_url) {
            window.location.href = data.redirect_url;
            return { success: true };
        }

        return data;
        
    } catch (error) {
        console.error('Error getting recommendations:', error);
        // Silently return fallback recommendations
        return {
            success: false,
            recommendations: getFallbackRecommendations()
        };
    }
}

    function displayFallbackRecommendations() {
        const fallbackRecs = [
            {
                title: "Top Historical Sites",
                description: "Explore the most significant historical landmarks",
                link: "/historical-sites"
            },
            {
                title: "Local Cuisine Hotspots",
                description: "Best restaurants for authentic local food",
                link: "/local-food"
            },
            {
                title: "Nature & Outdoor Activities",
                description: "Beautiful parks and outdoor adventures",
                link: "/outdoor-activities"
            }
        ];
        
        displayRecommendations(fallbackRecs);
        addSystemMessage("We're having trouble loading personalized recommendations. Here are some general suggestions for your destination.");
    }

    function displayRecommendations(recommendations) {
        const container = document.createElement('div');
        container.className = 'recommendations-container animate__animated animate__fadeIn';
        
        const heading = document.createElement('h4');
        heading.className = 'text-center mb-4';
        
        const mood = chatState.tripData.moods?.length > 0 ? 
                    chatState.tripData.moods[0] : 'adventure';
        
        heading.textContent = `✨ Recommended experiences for your ${mood} trip to ${chatState.tripData.destination} ✨`;
        container.appendChild(heading);
        
        if (!recommendations || recommendations.length === 0) {
            const alert = document.createElement('div');
            alert.className = 'alert alert-warning';
            alert.textContent = 'No recommendations found. Please try again later.';
            container.appendChild(alert);
            chatMessages.appendChild(container);
            scrollToBottom();
            return;
        }
        
        const row = document.createElement('div');
        row.className = 'row';
        
        recommendations.forEach((rec) => {
            const col = document.createElement('div');
            col.className = 'col-md-4 mb-4';
            
            const card = document.createElement('div');
            card.className = 'card h-100 recommendation-card';
            
            // Add image if available
            const img = rec.photo_url ? 
                `<img src="${rec.photo_url}" class="card-img-top" alt="${rec.name || rec.title}" style="height: 200px; object-fit: cover;">` : 
                '<div class="card-img-top bg-secondary" style="height: 200px; display: flex; align-items: center; justify-content: center;">' +
                '<i class="fas fa-map-marker-alt fa-3x text-light"></i></div>';
            
            card.innerHTML = `
                ${img}
                <div class="card-body">
                    <h5 class="card-title">${rec.name || rec.title}</h5>
                    <p class="card-text">${rec.address || rec.description}</p>
                    ${rec.rating ? `<p class="text-muted"><i class="fas fa-star"></i> ${rec.rating} (${rec.user_ratings_total || '0'} reviews)</p>` : ''}
                </div>
            `;
            
            // Add click handler
            if (rec.place_id) {
                card.style.cursor = 'pointer';
                card.addEventListener('click', () => {
                    window.open(`https://www.google.com/maps/place/?q=place_id:${rec.place_id}`, '_blank');
                });
            } else if (rec.link) {
                card.style.cursor = 'pointer';
                card.addEventListener('click', () => {
                    window.location.href = rec.link;
                });
            }
            
            // Add hover effects
            card.style.transition = 'transform 0.3s, box-shadow 0.3s';
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-5px)';
                card.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
                card.style.boxShadow = '';
            });
            
            col.appendChild(card);
            row.appendChild(col);
        });
        
        container.appendChild(row);
        
        // Add reset button
        const resetBtn = document.createElement('button');
        resetBtn.className = 'btn btn-primary mt-4 d-block mx-auto';
        resetBtn.innerHTML = '<i class="fas fa-sync-alt mr-2"></i> Plan Another Trip';
        resetBtn.addEventListener('click', startChat);
        container.appendChild(resetBtn);
        
        // Add to chat
        chatMessages.appendChild(container);
        scrollToBottom();
    }
});
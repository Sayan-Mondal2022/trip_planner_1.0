// Enhanced Chat Logic for Trip Planner

document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');

    // State Management
    const chatState = {
        currentStep: 'intro',
        tripData: {
            source: '',
            destination: '',
            travel_date: '',
            duration: '',
            num_travelers: 0,
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
        inputCallback: null
    };

    // Icons for Options
    const icons = {
        solo: '<i class="fas fa-user fa-lg"></i>',
        couple: '<i class="fas fa-heart fa-lg"></i>',
        family: '<i class="fas fa-users fa-lg"></i>',
        friends: '<i class="fas fa-user-friends fa-lg"></i>',
        elders: '<i class="fas fa-user-plus fa-lg"></i>',
        chill: '<i class="fas fa-hot-tub fa-lg"></i>',
        adventure: '<i class="fas fa-mountain fa-lg"></i>',
        food: '<i class="fas fa-utensils fa-lg"></i>',
        peace: '<i class="fas fa-spa fa-lg"></i>',
        culture: '<i class="fas fa-landmark fa-lg"></i>',
        instagram: '<i class="fas fa-camera fa-lg"></i>',
        nature: '<i class="fas fa-leaf fa-lg"></i>',
        car: '<i class="fas fa-car fa-lg"></i>',
        flight: '<i class="fas fa-plane fa-lg"></i>',
        train: '<i class="fas fa-train fa-lg"></i>',
        bus: '<i class="fas fa-bus fa-lg"></i>',
        mixed: '<i class="fas fa-random fa-lg"></i>',
        budget: '<i class="fas fa-bed fa-lg"></i>',
        mid: '<i class="fas fa-hotel fa-lg"></i>',
        luxury: '<i class="fas fa-concierge-bell fa-lg"></i>',
        scenic: '<i class="fas fa-mountain fa-lg"></i>',
        fastest: '<i class="fas fa-tachometer-alt fa-lg"></i>',
        flexible: '<i class="fas fa-exchange-alt fa-lg"></i>',
        sunny: '<i class="fas fa-sun fa-lg"></i>',
        no_rain: '<i class="fas fa-cloud-rain fa-lg text-muted"></i>',
        cold: '<i class="fas fa-snowflake fa-lg"></i>',
        any: '<i class="fas fa-cloud-sun fa-lg"></i>'
    };

    // Chat Flow Configuration
    const chatFlow = {
        intro: {
            message: "Welcome! ✨ I'm your personalized trip planning assistant. Let's work together to design a journey that perfectly matches your travel aspirations. Shall we begin?",
            options: [
                { text: "Let's get started", value: 'start', emoji: '✈️' }
            ],
            nextStep: 'source'
        },
        source: {
            message: "To start crafting your perfect itinerary, where will your journey begin? 🌍 Please share your departure location:",
            input: true,
            handler: (value) => {
                chatState.tripData.source = value;
                updateProgress(10);
                return 'destination';
            }
        },
        destination: {
            message: "Excellent choice! Now, where would you like to explore? 🗺️ Share your dream destination with me:",
            input: true,
            handler: (value) => {
                chatState.tripData.destination = value;
                updateProgress(15);
                return 'travel_date';
            }
        },
        travel_date: {
            message: "When are you planning to travel? 📅 You can specify exact dates, a month, or simply say 'next summer' or 'in December':",
            input: true,
            handler: (value) => {
                chatState.tripData.travel_date = value;
                updateProgress(20);
                return 'duration';
            }
        },
        duration: {
            message: "How long will your adventure last? ⏳ Please share the number of days and nights you'll be traveling:",
            input: true,
            inputType: 'number',
            handler: (value) => {
                chatState.tripData.duration = value;
                updateProgress(25);
                return 'travelers';
            }
        },
        travelers: {
            message: "How many travelers will be joining this journey? 👥 Please include yourself in the count:",
            input: true,
            inputType: 'number',
            handler: (value) => {
                chatState.tripData.num_travelers = parseInt(value);
                updateProgress(30);
                return 'traveler_type';
            }
        },
        traveler_type: {
            message: "What best describes your travel group? Please select one:",
            options: [
                { text: "Solo traveler", value: 'solo', icon: icons.solo },
                { text: "Couple", value: 'couple', icon: icons.couple },
                { text: "Family", value: 'family', icon: icons.family },
                { text: "Group of friends", value: 'friends', icon: icons.friends },
                { text: "Multi-generational group", value: 'elders', icon: icons.elders }
            ],
            handler: (value) => {
                chatState.tripData.traveler_type = value;
                updateProgress(40);
                return 'moods';
            }
        },
        moods: {
            message: "What kind of experience are you seeking? Select all that apply to help me tailor your perfect trip:",
            multiOptions: [
                { text: "Relaxation & rejuvenation", value: 'chill', icon: icons.chill },
                { text: "Adventure & excitement", value: 'adventure', icon: icons.adventure },
                { text: "Culinary exploration", value: 'food', icon: icons.food },
                { text: "Wellness & spirituality", value: 'peace', icon: icons.peace },
                { text: "Cultural immersion", value: 'culture', icon: icons.culture },
                { text: "Photogenic locations", value: 'instagram', icon: icons.instagram },
                { text: "Nature & outdoors", value: 'nature', icon: icons.nature }
            ],
            confirmBtn: "Confirm selections",
            handler: (values) => {
                chatState.tripData.moods = values;
                updateProgress(50);
                return 'transport';
            }
        },
        transport: {
            message: "What is your preferred mode of transportation?",
            options: [
                { text: "Personal vehicle (road trip)", value: 'car', icon: icons.car },
                { text: "Air travel", value: 'flight', icon: icons.flight },
                { text: "Train", value: 'train', icon: icons.train },
                { text: "Bus", value: 'bus', icon: icons.bus },
                { text: "Flexible options", value: 'mixed', icon: icons.mixed }
            ],
            handler: (value) => {
                chatState.tripData.transport_type = value;
                updateProgress(60);
                return 'accommodation';
            }
        },
        accommodation: {
            message: "What type of accommodation suits your preferences?",
            options: [
                { text: "Budget-friendly options", value: 'budget', icon: icons.budget },
                { text: "Comfortable mid-range", value: 'mid', icon: icons.mid },
                { text: "Premium/luxury stays", value: 'luxury', icon: icons.luxury }
            ],
            handler: (value) => {
                chatState.tripData.accommodation = value;
                updateProgress(65);
                return 'budget';
            }
        },
        budget: {
            message: "To help find options within your means, what is your approximate budget per person? You may specify an amount or say 'flexible' for suggestions across price ranges.",
            input: true,
            handler: (value) => {
                chatState.tripData.budget = value;
                updateProgress(70);
                return 'route_preference';
            }
        },
        route_preference: {
            message: "Regarding travel routes, which do you prefer?",
            options: [
                { text: "Scenic routes (more picturesque)", value: 'scenic', icon: icons.scenic },
                { text: "Most efficient route", value: 'fastest', icon: icons.fastest },
                { text: "No preference", value: 'flexible', icon: icons.flexible }
            ],
            handler: (value) => {
                chatState.tripData.route_preference = value;
                updateProgress(80);
                return 'weather_preference';
            }
        },
        weather_preference: {
            message: "Do you have any weather preferences for your trip?",
            options: [
                { text: "Sunny and warm", value: 'sunny', icon: icons.sunny },
                { text: "Avoid rainy periods", value: 'no_rain', icon: icons.no_rain },
                { text: "Cooler temperatures", value: 'cold', icon: icons.cold },
                { text: "Any weather is fine", value: 'any', icon: icons.any }
            ],
            handler: (value) => {
                chatState.tripData.weather_preference = value;
                updateProgress(85);
                return 'popular_preference';
            }
        },
        popular_preference: {
            message: "Would you like me to prioritize destinations and activities that are highly rated by other travelers?",
            options: [
                { text: "Yes, show popular choices", value: true, emoji: '👍' },
                { text: "No, I prefer unique experiences", value: false, emoji: '✨' }
            ],
            handler: (value) => {
                chatState.tripData.show_popular = value;
                updateProgress(90);
                return 'save_preference';
            }
        },
        save_preference: {
            message: "Would you like to save your preferences for future trip planning?",
            options: [
                { text: "Yes, save my preferences", value: true, emoji: '💾' },
                { text: "No, just for this trip", value: false, emoji: '🚫' }
            ],
            handler: (value) => {
                chatState.tripData.save_preferences = value;
                updateProgress(95);
                return 'summary';
            }
        },
        summary: {
            message: "Thank you for sharing all these details! I'm now crafting personalized recommendations based on your preferences. This will just take a moment...",
            handler: () => {
                saveTripData()
                    .then(response => {
                        if (response.success) {
                            updateProgress(100);
                            processStep('recommendations');
                        } else {
                            addSystemMessage("We encountered an issue saving your trip details. Let's try that again.");
                            processStep('intro');
                        }
                    })
                    .catch(error => {
                        console.error('Error saving trip:', error);
                        addSystemMessage("Apologies for the inconvenience. Let's start over.");
                        processStep('intro');
                    });
                return null;
            }
        },
        recommendations: {
            message: "Here are your customized travel recommendations for {{destination}}! These suggestions are carefully selected to match your preferences for {{mood}} experiences.",
            handler: () => {
                getRecommendations()
                    .then(response => {
                        if (response.success) {
                            displayRecommendations(response.recommendations);
                            addBotMessage("I hope these recommendations inspire your perfect trip! Feel free to ask if you'd like any adjustments or additional suggestions. Happy travels!");
                        } else {
                            addSystemMessage("We're having trouble retrieving recommendations at this time. Let's try again.");
                            processStep('intro');
                        }
                    })
                    .catch(error => {
                        console.error('Error getting recommendations:', error);
                        addSystemMessage("Something went wrong. Let's start over.");
                        processStep('intro');
                    });
                return null;
            }
        }
    };

    // Start the chat
    startChat();

    // Event Listeners
    chatInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter' && chatInput.value.trim() !== '') {
            handleUserInput();
        }
    });

    sendBtn.addEventListener('click', function () {
        if (chatInput.value.trim() !== '') {
            handleUserInput();
        }
    });

    // Functions

    function startChat() {
        chatMessages.innerHTML = '';
        chatState.currentStep = 'intro';
        chatState.tripData = {
            source: '',
            destination: '',
            travel_date: '',
            duration: '',
            num_travelers: 0,
            traveler_type: '',
            moods: [],
            transport_type: '',
            accommodation: '',
            budget: '',
            route_preference: '',
            weather_preference: '',
            show_popular: false,
            save_preferences: false
        };
        chatState.waitingForUserInput = false;
        chatInput.disabled = false;
        sendBtn.disabled = false;
        chatInput.focus();
        processStep('intro');
    }

    function processStep(stepName) {
        chatState.currentStep = stepName;
        const step = chatFlow[stepName];
        if (!step) {
            console.error(`Step "${stepName}" not found in chat flow`);
            return;
        }

        let message = step.message;
        if (message.includes('{{destination}}')) {
            message = message.replace('{{destination}}', chatState.tripData.destination);
        }
        if (message.includes('{{mood}}')) {
            const primaryMood = chatState.tripData.moods.length > 0 ? chatState.tripData.moods[0] : 'adventure';
            message = message.replace('{{mood}}', primaryMood);
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
        } else if (step.multiOptions) {
            addMultiOptions(step.multiOptions, step.confirmBtn || 'Confirm Selection', (values) => {
                if (step.handler) {
                    const nextStep = step.handler(values);
                    if (nextStep) processStep(nextStep);
                } else if (step.nextStep) {
                    processStep(step.nextStep);
                }
            });
        } else if (step.input) {
            enableUserInput((value) => {
                addUserMessage(value);
                if (step.handler) {
                    const nextStep = step.handler(value);
                    if (nextStep) processStep(nextStep);
                } else if (step.nextStep) {
                    processStep(step.nextStep);
                }
            }, step.inputType);
        } else if (step.handler) {
            const nextStep = step.handler();
            if (nextStep) processStep(nextStep);
        }
    }

    function addBotMessage(message, delay = 600) {
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'chat-bubble bot typing-indicator animate__animated animate__fadeIn';
        typingIndicator.innerHTML = '<span></span><span></span><span></span>';
        chatMessages.appendChild(typingIndicator);
        scrollToBottom();

        setTimeout(() => {
            chatMessages.removeChild(typingIndicator);
            const msgElement = document.createElement('div');
            msgElement.className = 'chat-bubble bot animate__animated animate__fadeInUp';
            msgElement.innerHTML = message;
            chatMessages.appendChild(msgElement);
            scrollToBottom();
        }, delay);
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

    function addOptions(options, callback) {
        const template = document.getElementById('options-template');
        const container = template.content.cloneNode(true).querySelector('.options-container');
        options.forEach(option => {
            const optTemplate = document.getElementById('option-item-template');
            const optElement = optTemplate.content.cloneNode(true).querySelector('.chat-option');
            optElement.dataset.value = option.value;

            optElement.querySelector('.option-icon').innerHTML = option.icon || `<span class="emoji">${option.emoji}</span>`;
            optElement.querySelector('.option-text').innerText = option.text;

            optElement.addEventListener('click', function () {
                const allOptions = container.querySelectorAll('.chat-option');
                allOptions.forEach(opt => opt.classList.remove('selected'));
                optElement.classList.add('selected');
                addUserMessage(option.text);
                setTimeout(() => {
                    container.remove();
                    callback(option.value);
                }, 500);
            });

            container.appendChild(optElement);
        });

        chatMessages.appendChild(container);
        scrollToBottom();
    }

    function addMultiOptions(options, confirmBtnText, callback) {
        const template = document.getElementById('multi-options-template');
        const container = template.content.cloneNode(true).querySelector('.multi-options-container');

        options.forEach(option => {
            const optTemplate = document.getElementById('multi-option-item-template');
            const optElement = optTemplate.content.cloneNode(true).querySelector('.multi-option');
            optElement.dataset.value = option.value;
            optElement.querySelector('.option-icon').innerHTML = option.icon || `<span class="emoji">${option.emoji}</span>`;
            optElement.querySelector('.option-text').innerText = option.text;

            optElement.addEventListener('click', function () {
                optElement.classList.toggle('selected');
            });

            container.appendChild(optElement);
        });

        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'btn btn-primary w-100 mt-3';
        confirmBtn.innerText = confirmBtnText;
        confirmBtn.addEventListener('click', function () {
            const selectedOptions = container.querySelectorAll('.multi-option.selected');
            if (selectedOptions.length === 0) {
                alert('Please select at least one option.');
                return;
            }

            const values = Array.from(selectedOptions).map(opt => opt.dataset.value);
            const selectedText = Array.from(selectedOptions).map(opt => opt.querySelector('.option-text').innerText).join(', ');
            addUserMessage(`Selected: ${selectedText}`);
            setTimeout(() => {
                container.remove();
                callback(values);
            }, 500);
        });

        container.appendChild(confirmBtn);
        chatMessages.appendChild(container);
        scrollToBottom();
    }

    function enableUserInput(callback, inputType = 'text') {
        chatState.waitingForUserInput = true;
        chatInput.disabled = false;
        chatInput.type = inputType;
        chatInput.focus();
        sendBtn.disabled = false;
        chatState.inputCallback = callback;
    }

    function handleUserInput() {
        if (!chatState.waitingForUserInput) return;
        const value = chatInput.value.trim();
        if (!value) return;

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

    function updateProgress(percent) {
        chatState.progress = percent;
        const existingBar = document.querySelector('.progress-bar');
        if (!existingBar) {
            const progressBar = document.createElement('div');
            progressBar.className = 'progress-container animate__animated animate__fadeIn';
            progressBar.innerHTML = `<div class="progress-bar" style="width: ${percent}%"></div>`;
            chatMessages.appendChild(progressBar);
        } else {
            existingBar.style.width = `${percent}%`;
        }
        scrollToBottom();
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
            if (!response.ok) throw new Error('Failed to save trip data');
            return { success: true, ...await response.json() };
        } catch (error) {
            console.error('Error saving trip:', error);
            return { success: false };
        }
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
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('Error getting recommendations:', error);
            return {
                success: false,
                recommendations: fallbackRecommendations(chatState.tripData.destination)
            };
        }
    }

    function fallbackRecommendations(destination) {
        return [
            { name: `Top Spots in ${destination}`, description: "Popular places to visit", photo_url: 'https://via.placeholder.com/400x200?text=Landmark' },
            { name: `Local Cuisine`, description: "Best local restaurants", photo_url: 'https://via.placeholder.com/400x200?text=Food' },
            { name: `Nature Parks`, description: "Outdoor adventures nearby", photo_url: 'https://via.placeholder.com/400x200?text=Nature' }
        ];
    }

    function displayRecommendations(recommendations) {
        const container = document.createElement('div');
        container.className = 'recommendations-container animate__animated animate__fadeIn';

        const heading = document.createElement('h4');
        heading.className = 'text-center mb-4';
        heading.textContent = `✨ Recommended experiences for your ${chatState.tripData.moods[0]} trip to ${chatState.tripData.destination} ✨`;
        container.appendChild(heading);

        const row = document.createElement('div');
        row.className = 'row';

        recommendations.forEach(rec => {
            const col = document.createElement('div');
            col.className = 'col-md-4 mb-4';

            const card = document.createElement('div');
            card.className = 'card h-100 recommendation-card shadow-sm';
            card.style.cursor = 'pointer';

            card.innerHTML = `
                <img src="${rec.photo_url || 'https://via.placeholder.com/400x200'}" class="card-img-top" alt="${rec.name}">
                <div class="card-body">
                    <h5 class="card-title">${rec.name}</h5>
                    <p class="card-text">${rec.description}</p>
                    ${rec.rating ? `<p class="text-muted"><i class="fas fa-star"></i> ${rec.rating} (${rec.user_ratings_total} reviews)</p>` : ''}
                </div>
            `;

            card.addEventListener('click', () => {
                window.open(rec.link || '#', '_blank'); 
            });

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

        const resetBtn = document.createElement('button');
        resetBtn.className = 'btn btn-primary mt-4 d-block mx-auto';
        resetBtn.innerHTML = '<i class="fas fa-sync-alt mr-2"></i> Plan Another Trip';
        resetBtn.addEventListener('click', startChat);

        container.appendChild(resetBtn);
        chatMessages.appendChild(container);
        scrollToBottom();
    }

    function getCSRFToken() {
        const cookieValue = document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];
        return cookieValue || '';
    }
});
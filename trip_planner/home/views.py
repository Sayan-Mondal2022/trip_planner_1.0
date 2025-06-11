from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.conf import settings
import json
import requests
import os
import time
from .forms import CompleteTripForm
from .mongo_utils import save_trip_plan
from huggingface_hub import InferenceClient

# Get API keys from environment variables or Django settings for security
GOOGLE_PLACES_API_KEY = getattr(settings, 'GOOGLE_PLACES_API_KEY', os.getenv('GOOGLE_PLACES_API_KEY'))
HF_TOKEN = getattr(settings, 'HUGGINGFACE_API_KEY', os.getenv('HUGGINGFACE_API_KEY'))

# Fix the client initialization logic
client = None
if HF_TOKEN:
    try:
        client = InferenceClient(
            provider="fireworks-ai",
            api_key=HF_TOKEN,
        )
    except Exception as e:
        print(f"Failed to initialize InferenceClient: {e}")
        client = None

# API URLs
GOOGLE_PLACES_SEARCH_URL = 'https://maps.googleapis.com/maps/api/place/textsearch/json'
# HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1"

def home(request):
    return render(request, "home/home.html")

def get_popular_destinations_fallback(destination=""):
    """Fallback function to get popular destinations when API fails"""
    if not destination:
        return [
            {
                'name': "Eiffel Tower, Paris",
                'description': "Iconic iron tower in Paris",
                'type': 'landmark',
                'photo_url': 'https://via.placeholder.com/400x200?text=Paris'
            },
            {
                'name': "Grand Canyon, USA",
                'description': "Breathtaking natural wonder",
                'type': 'nature',
                'photo_url': 'https://via.placeholder.com/400x200?text=GrandCanyon'
            },
            {
                'name': "Venice, Italy",
                'description': "City of canals and history",
                'type': 'city',
                'photo_url': 'https://via.placeholder.com/400x200?text=Venice'
            }
        ]
    
    return [
        {
            'name': f"Popular Place 1 in {destination}",
            'description': "A must-visit location",
            'type': 'landmark',
            'photo_url': 'https://via.placeholder.com/400x200?text=Landmark'
        },
        {
            'name': f"Popular Place 2 in {destination}",
            'description': "Great local experience",
            'type': 'cultural',
            'photo_url': 'https://via.placeholder.com/400x200?text=Culture'
        },
        {
            'name': f"Popular Place 3 in {destination}",
            'description': "Delicious local cuisine",
            'type': 'food',
            'photo_url': 'https://via.placeholder.com/400x200?text=Food'
        }
    ]

@csrf_exempt
def planTrip(request):
    if request.method == "POST":
        form = CompleteTripForm(request.POST)
        if form.is_valid():
            data = form.cleaned_data
            print(data)
            return JsonResponse({'success': True, 'message': 'Form submitted successfully!'})
        else:
            return JsonResponse({'success': False, 'errors': form.errors})

    form = CompleteTripForm()
    return render(request, "home/planTrip.html", {'form': form})

def index(request):
    popular_destinations = get_popular_destinations_fallback()
    context = {'popular_destinations': popular_destinations}
    return render(request, 'home/home.html', context)

@csrf_exempt
@require_POST
def save_trip(request):
    """API endpoint to save the complete trip plan"""
    try:
        data = json.loads(request.body)
        print("Data is:", data)
        form = CompleteTripForm(data)
        
        if form.is_valid():
            print("Form is valid")
            trip_id = save_trip_plan(form.cleaned_data)
            return JsonResponse({
                'success': True,
                'trip_id': trip_id,
                'message': 'Trip plan saved successfully!'
            })
        else:
            return JsonResponse({
                'success': False,
                'errors': form.errors,
                'message': 'Invalid form data'
            }, status=400)
            
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error: {str(e)}'
        }, status=500)

@csrf_exempt
@require_POST
def get_recommendations(request):
    """Enhanced recommendations with better error handling and API key validation"""
    try:
        # Validate API key
        if not GOOGLE_PLACES_API_KEY:
            return JsonResponse({
                'success': False,
                'message': 'Google Places API key not configured'
            }, status=500)

        data = json.loads(request.body)
        
        # Extract and validate required fields
        destination = data.get('destination')
        if not destination:
            return JsonResponse({
                'success': False,
                'message': 'Destination is required'
            }, status=400)

        # Extract other trip details with defaults
        moods = data.get('moods', [])
        interests = data.get('interests', [])
        travel_style = data.get('travel_style', 'relaxed')
        budget = data.get('budget', 'medium')
        group_size = data.get('group_size', 1)
        duration = data.get('duration', 3)
        show_popular = data.get('show_popular', False)

        # Prepare data for recommendation generation
        trip_data = {
            'destination': destination,
            'moods': moods,
            'interests': interests,
            'travel_style': travel_style,
            'budget': budget,
            'group_size': group_size,
            'duration': duration,
            'show_popular': show_popular
        }

        recommendations = generate_recommendations(trip_data)
        
        if not recommendations:
            recommendations = get_popular_destinations_fallback(destination)
            
        # Enhanced session storage with more trip details
        request.session.update({
            'recommendations': recommendations,
            'destination': destination,
            'moods': moods,
            'interests': interests,
            'travel_style': travel_style,
            'budget': budget,
            'group_size': group_size,
            'duration': duration
        })
        request.session.modified = True

        return JsonResponse({
            'success': True,
            'redirect_url': '/recommendations/',
            'recommendations': recommendations[:15],  # Limit to 15 for initial display
            'count': len(recommendations)
        })
    
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        print(f"Error in get_recommendations: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Server error while processing request: {str(e)}'
        }, status=500)
    

def categorize_places_by_type(places):
    """Categorize places by their types for better itinerary planning"""
    categories = {
        'attractions': [],
        'restaurants': [],
        'entertainment': [],
        'shopping': [],
        'nature': [],
        'cultural': [],
        'religious': [],
        'museums': []
    }
    
    for place in places:
        types = place.get('types', [])
        name = place.get('name', '')
        
        # Categorization logic based on Google Places types
        if any(t in types for t in ['tourist_attraction', 'point_of_interest', 'establishment']):
            categories['attractions'].append(place)
        elif any(t in types for t in ['restaurant', 'food', 'meal_takeaway', 'cafe']):
            categories['restaurants'].append(place)
        elif any(t in types for t in ['night_club', 'bar', 'amusement_park']):
            categories['entertainment'].append(place)
        elif any(t in types for t in ['shopping_mall', 'store', 'clothing_store']):
            categories['shopping'].append(place)
        elif any(t in types for t in ['park', 'natural_feature']):
            categories['nature'].append(place)
        elif any(t in types for t in ['museum', 'art_gallery']):
            categories['museums'].append(place)
        elif any(t in types for t in ['church', 'hindu_temple', 'mosque', 'synagogue']):
            categories['religious'].append(place)
        else:
            categories['cultural'].append(place)
    
    return categories

def generate_recommendations(trip_data):
    """Enhanced recommendation generation with better error handling and API validation"""
    try:
        destination = trip_data.get('destination')
        moods = trip_data.get('moods', '')
        interests = trip_data.get('interests', [])
        
        if not destination:
            return []

        if not GOOGLE_PLACES_API_KEY:
            print("Google Places API key not found")
            return []

        # Create more specific query based on interests
        interest_terms = ' '.join(interests) if interests else ''
        query = f"{destination} {moods} {interest_terms} places to visit attractions"
        
        print(f"Querying Places API for: {query}")
        
        # Add timeout and proper error handling
        try:
            response = requests.get(
                GOOGLE_PLACES_SEARCH_URL, 
                params={
                    'query': query,
                    'key': GOOGLE_PLACES_API_KEY,
                    'type': 'point_of_interest'
                },
                timeout=10
            )
        except requests.exceptions.Timeout:
            print("Google Places API request timed out")
            return []
        except requests.exceptions.RequestException as e:
            print(f"Request error: {e}")
            return []

        if response.status_code != 200:
            print(f"API Error Status: {response.status_code}")
            print(f"API Error Response: {response.text}")
            return []

        try:
            data = response.json()
        except json.JSONDecodeError:
            print("Invalid JSON response from Google Places API")
            return []
        
        if data.get('status') != 'OK':
            error_message = data.get('error_message', 'Unknown error')
            print(f"Google Places API Error: Status={data.get('status')}, Message={error_message}")
            
            # Handle specific API errors
            if data.get('status') == 'REQUEST_DENIED':
                print("API Key might be invalid or not enabled for Places API")
            elif data.get('status') == 'OVER_QUERY_LIMIT':
                print("API quota exceeded")
            elif data.get('status') == 'ZERO_RESULTS':
                print("No results found for the query")
            
            return []

        results = data.get('results', [])
        
        if not results:
            print("No results returned from Google Places API")
            return []
        
        # Enhanced filtering with minimum quality standards
        filtered_results = [
            p for p in results 
            if p.get('rating', 0) >= 3.5  # Minimum rating
            and p.get('user_ratings_total', 0) >= 10  # Minimum reviews
            and p.get('name')  # Must have a name
        ]
        
        # Sort by popularity score (rating × log of review count for better balance)
        import math
        sorted_places = sorted(filtered_results, key=lambda x: (
            x.get('rating', 0) * math.log(max(x.get('user_ratings_total', 1), 1))
        ), reverse=True)

        recommendations = []
        for place in sorted_places[:25]:  # Get more places for better itinerary generation
            photo_url = None
            if place.get('photos') and GOOGLE_PLACES_API_KEY:
                try:
                    photo_url = (
                        f"https://maps.googleapis.com/maps/api/place/photo"
                        f"?maxwidth=400&photo_reference={place['photos'][0]['photo_reference']}"
                        f"&key={GOOGLE_PLACES_API_KEY}"
                    )
                except (KeyError, IndexError):
                    pass
            
            recommendations.append({
                'name': place.get('name'),
                'address': place.get('formatted_address'),
                'rating': place.get('rating'),
                'user_ratings_total': place.get('user_ratings_total'),
                'types': place.get('types', []),
                'photo_url': photo_url,
                'place_id': place.get('place_id'),
                'price_level': place.get('price_level'),
                'opening_hours': place.get('opening_hours', {}).get('open_now')
            })
        
        print(f"Generated {len(recommendations)} recommendations")
        return recommendations
    
    except Exception as e:
        print(f"Error in generate_recommendations: {e}")
        return []

def recommendations_view(request):
    recommendations = request.session.get('recommendations', [])
    destination = request.session.get('destination', '')
    moods = request.session.get('moods', '')
    
    context = {
        'places': recommendations,
        'destination': destination,
        'mood': moods,
        'error': None if recommendations else "No recommendations found"
    }
    
    return render(request, 'home/recommendations.html', context)

def generate_itinerary_with_deepseek(prompt: str, max_tokens: int = 2000, temperature: float = 0.7) -> str:
    if not client:
        return "AI service is currently unavailable. Please try again later."
    
    try:
        system_message = (
        "You are a professional travel planning assistant. Create detailed, practical itineraries with:\n"
        "- Logical daily schedules with time allocations\n"
        "- Realistic travel times between locations\n"
        "- Varied activities (cultural, dining, leisure)\n"
        "- Local tips and recommendations\n"
        "- Budget considerations when specified\n"
        "- Clear section headers and organization\n"
        "- Mobile-friendly formatting"
    )
        completion = client.chat.completions.create(
            model="deepseek-ai/DeepSeek-R1",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": prompt}
            ],
            max_tokens=max_tokens,
            temperature=temperature,
            timeout=30
        )
        return _extract_itinerary_response(completion)
    except Exception as e:
        return _handle_itinerary_error(e)

def _extract_itinerary_response(completion) -> str:
    """Extract and clean the itinerary response content"""
    if (hasattr(completion, 'choices') and completion.choices and 
        hasattr(completion.choices[0], 'message') and
        hasattr(completion.choices[0].message, 'content')):
        content = completion.choices[0].message.content
        return content.strip() if content else "Received empty response from AI model."
    return "Sorry, couldn't generate a proper response from the AI model."

def _handle_itinerary_error(error: Exception) -> str:
    """Handle different types of itinerary generation errors"""
    error_msg = str(error).lower()
    
    if "rate limit" in error_msg or "429" in error_msg:
        return "Our travel planning service is currently busy. Please try again in a few minutes."
    elif "authentication" in error_msg or "401" in error_msg:
        return "Service authentication issue. Please contact support."
    elif "timeout" in error_msg:
        return "Request took too long. Please try again with a more specific request."
    elif "model" in error_msg and "unavailable" in error_msg:
        return "Travel planning service is temporarily unavailable."
    else:
        return "Sorry, we encountered an issue generating your itinerary. Please try again later."
    

@csrf_exempt
@require_POST
def generate_itinerary(request):
    """Enhanced itinerary generation with better error handling"""
    try:
        data = json.loads(request.body)
        
        # Get data from request or session0
        trip_data = get_trip_data(request, data)

        destination = trip_data["destination"]
        moods = trip_data["moods"]
        interests = trip_data["interests"]
        days = trip_data["days"]
        travel_style = trip_data["travel_style"]
        budget = trip_data["budget"]
        group_size = trip_data["group_size"]
        
        # Get selected places from request or use recommendations from session
        selected_places = data.get('selected_places', [])
        if not selected_places:
            # Use all recommendations if no specific places selected
            recommendations = request.session.get('recommendations', [])
            selected_places = recommendations[:min(len(recommendations), days * 4)]  # Limit based on days
        
        if not destination:
            return JsonResponse({
                'success': False,
                'message': 'Destination is required.'
            }, status=400)
        
        if not selected_places:
            return JsonResponse({
                'success': False,
                'message': 'No places available for itinerary generation.'
            }, status=400)

        # Categorize places for better distribution
        categorized_places = categorize_places_by_type(selected_places)
        
        # Create detailed place information for the prompt
        places_info = []
        for place in selected_places[:days * 5]:  # Limit places for prompt size
            place_info = f"- {place.get('name', 'Unknown')}"
            if place.get('rating'):
                place_info += f" (Rating: {place.get('rating')}/5"
                if place.get('user_ratings_total'):
                    place_info += f", {place.get('user_ratings_total')} reviews"
                place_info += ")"
            if place.get('types'):
                place_info += f" - Categories: {', '.join(place.get('types', [])[:3])}"
            if place.get('address'):
                place_info += f" - Location: {place.get('address')}"
            places_info.append(place_info)

        # Create comprehensive prompt
        prompt = f"""Create a beautiful, easy-to-read, and highly informative {days}-day travel itinerary for {destination}.

TRAVELER PROFILE:
- Interests: {', '.join(interests) if interests else 'General sightseeing'}
- Mood/Preferences: {', '.join(moods) if isinstance(moods, list) else moods}
- Travel Style: {travel_style}
- Budget Level: {budget}
- Group Size: {group_size} {'person' if group_size == 1 else 'people'}

SELECTED PLACES TO VISIT:
{chr(10).join([f'- {place.get("name")} ({", ".join([t.replace("_", " ").title() for t in place.get("types", [])[:2]] or ["Unknown"])})' for place in selected_places])}

INSTRUCTIONS FOR ITINERARY:
1. Use a clean, modern layout with sections clearly marked using emojis (e.g., 🌞 Morning, 🌇 Evening).
2. For each day, include:
   - A catchy daily theme (e.g., “Cultural Immersion Day” or “Nature & Adventure”)
   - Logical flow of activities with realistic timing
   - Approximate travel time between locations (if relevant)
   - Suggested transportation method (walking, taxi, metro, etc.)
   - Notes about opening hours (if available)
   - Estimated cost per activity to match budget level
   - Brief explanation why each place fits traveler’s preferences
3. Include practical tips like:
   - Where to eat nearby (suggest restaurant-type places from the list)
   - Best times to visit crowded spots
   - Dress code or ticket booking advice
   - Local customs or language phrases
4. Format it as a plan that can be printed or viewed on mobile easily.
5. Avoid markdown. Use clear spacing, bullet points, and symbols for visual appeal.
6. Ensure all places are from the SELECTED PLACES list above — do not invent new ones.
7. Keep the pace aligned with '{travel_style}' style – avoid overloading the schedule.

RESPONSE FORMAT EXAMPLE:

🌞 DAY 1: [Daily Theme]
📍 MORNING (9:00 AM - 12:00 PM)
• Activity: [Place Name]
• Why: [Brief reason based on traveler profile]
• Location: [Address]
• Tip: [Opening hours / tickets / transport notes]

🍽️ LUNCH (12:00 PM - 1:30 PM)
• Restaurant: [Nearby recommended dining spot]
• Cost: ~[Estimated price range]
• Cuisine: [Type of food served]

🌳 AFTERNOON (2:00 PM - 5:00 PM)
• Activity: [Place Name]
• Why: [Relevance to mood or interests]
• Tip: [Best way to get there or local tip]

🌃 EVENING (6:00 PM - 8:00 PM)
• Activity: [Place Name]
• Why: [Why it suits the evening vibe]
• Tip: [Special events or night views]

📌 TRAVEL TIPS FOR THE DAY:
- [Tip 1]
- [Tip 2]

Repeat this format for each day, keeping it engaging, practical, and personalized."""
        # Generate itinerary using DeepSeek-R1
        # Generate itinerary using Mistral
        try:
            itinerary = generate_itinerary_with_deepseek(prompt).strip()

            # Store the generated itinerary in session
            request.session['generated_itinerary'] = {
                'itinerary': itinerary,
                'destination': destination,
                'days': days,
                'places_used': selected_places,
                'generated_at': str(json.dumps(data))
            }
            request.session.modified = True

            return JsonResponse({
                'success': True,
                'itinerary': itinerary,
                'places_count': len(selected_places),
                'destination': destination,
                'days': days
            })

        except Exception as ai_error:
            error_message = str(ai_error)
            print(f"AI API Error: {error_message}")
            
            return JsonResponse({
                'success': False,
                'message': 'Failed to generate itinerary due to AI service error. Please try again.'
            }, status=500)

    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid JSON data'
        }, status=400)
    except ValueError as e:
        return JsonResponse({
            'success': False,
            'message': f'Invalid data format: {str(e)}'
        }, status=400)
    except Exception as e:
        print(f"Error in generate_itinerary: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': 'Server error while generating itinerary.'
        }, status=500)

@csrf_exempt
@require_POST
def regenerate_itinerary(request):
    """Regenerate itinerary with different parameters or feedback using DeepSeek-R1"""
    try:
        data = json.loads(request.body)
        feedback = data.get('feedback', '')
        
        # Get previous itinerary data from session
        previous_itinerary = request.session.get('generated_itinerary', {})
        
        if not previous_itinerary:
            return JsonResponse({
                'success': False,
                'message': 'No previous itinerary found. Please generate a new one.'
            }, status=400)
        
        # Create feedback-based prompt
        modified_prompt = f"""Please modify the following travel itinerary based on this feedback:

FEEDBACK: {feedback}

ORIGINAL ITINERARY:
{previous_itinerary.get('itinerary', '')}

Please provide an updated itinerary that addresses the feedback while maintaining the same destination, duration, and available places. Keep the same format and structure as the original."""
        
        # Generate updated itinerary using DeepSeek-R1
        itinerary = generate_itinerary_with_deepseek(modified_prompt)
        
        # Update session with new itinerary
        request.session['generated_itinerary'].update({
            'itinerary': itinerary,
            'regenerated_with_feedback': feedback,
            'regenerated_at': time.time()
        })
        request.session.modified = True
        
        return JsonResponse({
            'success': True,
            'itinerary': itinerary,
            'message': 'Itinerary regenerated successfully'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error regenerating itinerary: {str(e)}'
        }, status=500)

@csrf_exempt
def get_trip_data_api(request):
    """API endpoint to get current trip data from session"""
    try:
        recommendations = request.session.get('recommendations', [])
        destination = request.session.get('destination', '')
        moods = request.session.get('moods', [])
        interests = request.session.get('interests', [])
        travel_style = request.session.get('travel_style', 'relaxed')
        budget = request.session.get('budget', 'medium')
        group_size = request.session.get('group_size', 1)
        duration = request.session.get('duration', 3)
        
        return JsonResponse({
            'success': True,
            'places': recommendations,
            'destination': destination,
            'moods': moods,
            'interests': interests,
            'travel_style': travel_style,
            'budget': budget,
            'group_size': group_size,
            'duration': duration
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

def get_trip_data(request, data=None):
    """More robust session data handling"""
    try:
        if data is None:
            try:
                data = json.loads(request.body)
            except (json.JSONDecodeError, AttributeError):
                data = {}

        def get_value(key, default=None):
            # First try POST data, then session, then default
            value = data.get(key, request.session.get(key, default))
            # Ensure lists are properly formatted
            if isinstance(value, str) and key in ['moods', 'interests']:
                value = [v.strip() for v in value.split(',') if v.strip()]
            return value

        return {
            'destination': get_value('destination', ''),
            'moods': get_value('moods', []),
            'interests': get_value('interests', []),
            'travel_style': get_value('travel_style', 'relaxed'),
            'budget': get_value('budget', 'medium'),
            'group_size': int(get_value('group_size', 1)),
            'days': int(get_value('days', 3)),
            'selected_places': data.get('selected_places', request.session.get('recommendations', [])[:3])
        }
    except Exception as e:
        print(f"Error in get_trip_data: {e}")
        return {}
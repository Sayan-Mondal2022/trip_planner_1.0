# itineraryPlan/views.py
from django.shortcuts import render, get_object_or_404
from .models import Trip

def itinerary_view(request, trip_id):
    trip = get_object_or_404(Trip, id=trip_id, user=request.user)
    # Add more context data as needed
    context = {
        'trip': trip,
    }
    return render(request, 'itineraryPlan/itinerary.html', context)
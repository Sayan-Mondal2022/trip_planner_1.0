from django.urls import path
from . import views

# app_name = "home"

urlpatterns = [
    path("", views.home, name="home"),
    path("planTrip/", views.planTrip, name="planTrip"),
    path('api/save-trip/', views.save_trip, name='save_trip'),
    path('recommendations/', views.recommendations_view, name='recommendations'),
    path('api/get_recommendations/', views.get_recommendations, name='get_recommendations'),

    # New URL for itinerary generation
    path('api/generate_itinerary/', views.generate_itinerary, name='generate_itinerary'),

    # Optional: URL for itinerary regeneration
    path('api/regenerate_itinerary/', views.regenerate_itinerary, name='regenerate_itinerary'),

    # path("api/get_trip_data/", views.get_trip_data, name="get_trip_data"),
    path("api/get_trip_data/", views.get_trip_data_api, name="get_trip_data_api")
]
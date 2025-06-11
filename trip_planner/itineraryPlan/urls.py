from django.urls import path, include
from . import views  # import your views

app_name = 'itineraryPlan'

urlpatterns = [
    path('itinerary/<int:trip_id>/', views.itinerary_view, name='itinerary'),
]
from django import forms

class CompleteTripForm(forms.Form):
    """Combined form for all trip planning data"""
    # Basic trip details
    source = forms.CharField(max_length=100, required=True)
    destination = forms.CharField(max_length=100, required=True)
    travel_date = forms.CharField(max_length=100, required=True)
    duration = forms.CharField(max_length=50, required=True)
    
    # Traveler information
    num_travelers = forms.IntegerField(min_value=1, required=True)
    traveler_type = forms.ChoiceField(choices=[
        ('solo', 'Solo'),
        ('couple', 'Couple'),
        ('family', 'Family'),
        ('friends', 'Friends'),
        ('elders', 'With Elders'),
    ], required=True)
    
    # Trip preferences - Updated to handle multiple moods properly
    moods = forms.MultipleChoiceField(
        choices=[
            ('chill', 'Relaxation & Wellness'),
            ('adventure', 'Adventure & Thrills'),
            ('food', 'Culinary Exploration'),
            ('spiritual', 'Spiritual Journey'),
            ('culture', 'Cultural Immersion'),
            ('instagram', 'Photography Focus'),
            ('nature', 'Nature Connection'),
            ('nightlife', 'Vibrant Nightlife'),
        ], 
        required=True,
        widget=forms.CheckboxSelectMultiple
    )
    
    transport_type = forms.ChoiceField(choices=[
        ('car', 'Car'),
        ('flight', 'Flight'),
        ('train', 'Train'),
        ('bus', 'Bus'),
        ('mixed', 'Mixed'),
    ], required=True)
    
    accommodation = forms.ChoiceField(choices=[
        ('budget', 'Budget'),
        ('mid', 'Mid-range'),
        ('luxury', 'Luxury'),
    ], required=True)
    
    budget = forms.CharField(max_length=100, required=True)
    
    route_preference = forms.ChoiceField(choices=[
        ('scenic', 'Scenic'),
        ('fastest', 'Fastest'),
        ('flexible', 'Flexible'),
    ], required=True)
    
    weather_preference = forms.ChoiceField(choices=[
        ('sunny', 'Sunny'),
        ('no_rain', 'No Rain'),
        ('cold', 'Cold'),
        ('any', 'Any'),
    ], required=True)
    
    # Optional preferences
    show_popular = forms.BooleanField(required=False)
    save_preferences = forms.BooleanField(required=False)
    
    def clean_moods(self):
        """Custom validation for moods field"""
        moods = self.cleaned_data.get('moods')
        if not moods:
            raise forms.ValidationError("Please select at least one mood preference.")
        
        # Convert single string to list if needed
        if isinstance(moods, str):
            moods = [moods]
        
        # Validate each mood choice
        valid_moods = [choice[0] for choice in self.fields['moods'].choices]
        invalid_moods = [mood for mood in moods if mood not in valid_moods]
        
        if invalid_moods:
            raise forms.ValidationError(f"Invalid mood choices: {', '.join(invalid_moods)}")
            
        return moods
    
    
    def clean_num_travelers(self):
        """Custom validation for number of travelers"""
        num_travelers = self.cleaned_data.get('num_travelers')
        if num_travelers is not None and num_travelers < 1:
            raise forms.ValidationError("Number of travelers must be at least 1.")
        return num_travelers
    
    def clean_travel_date(self):
        """Custom validation for travel date"""
        travel_date = self.cleaned_data.get('travel_date')
        if not travel_date or not travel_date.strip():
            raise forms.ValidationError("Travel date is required.")
        return travel_date.strip()
    
    def clean_source(self):
        """Custom validation for source"""
        source = self.cleaned_data.get('source')
        if not source or not source.strip():
            raise forms.ValidationError("Source location is required.")
        return source.strip()
    
    def clean_destination(self):
        """Custom validation for destination"""
        destination = self.cleaned_data.get('destination')
        if not destination or not destination.strip():
            raise forms.ValidationError("Destination is required.")
        return destination.strip()
    
    def clean_duration(self):
        """Custom validation for duration"""
        duration = self.cleaned_data.get('duration')
        if not duration or not duration.strip():
            raise forms.ValidationError("Trip duration is required.")
        return duration.strip()
    
    def clean_budget(self):
        """Custom validation for budget"""
        budget = self.cleaned_data.get('budget')
        if not budget or not budget.strip():
            raise forms.ValidationError("Budget information is required.")
        return budget.strip()
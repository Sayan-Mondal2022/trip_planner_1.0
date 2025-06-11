from pymongo import MongoClient
from datetime import datetime, timezone
import logging
from pymongo.errors import PyMongoError

logger = logging.getLogger(__name__)

# MongoDB Configuration
MONGO_URI = 'mongodb://localhost:27017/'
DATABASE_NAME = 'trip_details'

def get_db():
    """Get MongoDB database instance with connection pooling"""
    try:
        client = MongoClient(
            MONGO_URI,
            maxPoolSize=50,
            connectTimeoutMS=30000,
            socketTimeoutMS=30000,
            serverSelectionTimeoutMS=5000
        )
        
        # Test the connection
        client.admin.command('ping')
        db = client[DATABASE_NAME]
        
        return db
    except PyMongoError as e:
        logger.error(f"MongoDB connection error: {str(e)}", exc_info=True)
        raise ConnectionError(f"Failed to connect to MongoDB: {str(e)}")

def save_trip_plan(trip_data):
    """
    Save a complete trip plan with basic validation
    Returns: trip_id (str) or None on failure
    """
    if not trip_data:
        logger.error("Empty trip data received")
        raise ValueError("Trip data cannot be empty")
        
    required_fields = ['source', 'destination', 'travel_date']
    missing_fields = [field for field in required_fields if not trip_data.get(field)]
    
    if missing_fields:
        error_msg = f"Missing required trip fields: {', '.join(missing_fields)}"
        logger.error(error_msg)
        raise ValueError(error_msg)

    try:
        db = get_db()
        
        current_time = datetime.now(timezone.utc)
        trip_data['created_at'] = current_time
        trip_data['updated_at'] = current_time
        
        # Ensure required fields have default values
        trip_data.setdefault('status', 'active')
        trip_data.setdefault('user_id', 'anonymous')
        
        # Convert lists to proper format for MongoDB
        if 'moods' in trip_data:
            if isinstance(trip_data['moods'], str):
                trip_data['moods'] = [trip_data['moods']]
            elif not isinstance(trip_data['moods'], list):
                trip_data['moods'] = list(trip_data['moods'])
        
        result = db.trips.insert_one(trip_data)
        logger.info(f"Trip saved successfully with ID: {result.inserted_id}")
        return str(result.inserted_id)
    
    except PyMongoError as e:
        logger.error(f"Database error saving trip: {str(e)}", exc_info=True)
        raise Exception(f"Failed to save trip: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error saving trip: {str(e)}", exc_info=True)
        raise Exception(f"Failed to save trip: {str(e)}")
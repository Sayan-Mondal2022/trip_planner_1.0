from pymongo.mongo_client import MongoClient

url = "mongodb://localhost:27017/"
client = MongoClient(url)

db = client['travel_database']
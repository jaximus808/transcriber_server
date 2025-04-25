import os
import requests
# import json
from dotenv import load_dotenv
load_dotenv()
from enum import Enum

class API_METHODS(Enum):
    GET = 0
    POST = 1

class FoundryAPI:
    def __init__(self, route: str, method: API_METHODS):
        access_token = os.getenv("FOUNDRY_TOKEN")
        if not access_token:
            raise EnvironmentError("FOUNDRY_TOKEN is required")

        endpoint = os.getenv("FOUNDRY_ENDPOINT")
        if not endpoint:
            raise EnvironmentError("FOUNDRY_ENDPOINT is required")

        self.endpoint = endpoint + route
        self.access_token = access_token
        self.method = method

    def apply(self, payload: dict) -> dict:
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
        try:
            match self.method:
                case API_METHODS.GET:
                    response = requests.get(self.endpoint, headers=headers)
                    response.raise_for_status()
                    return response.json()
                case API_METHODS.POST:
                    response = requests.post(self.endpoint, json=payload, headers=headers)
                    response.raise_for_status()
                    return response.json()
                    
        except requests.exceptions.RequestException as e:
            print(f"Error in apply request: {e}")
            raise

# if __name__ == "__main__":
#     print("making api request")
#     api = FoundryAPI(
#         "/v2/ontologies/ontology-ef92f6b4-0076-41a3-a5c2-780c41133c87/actions/delete-hierarchy-org/apply", 
#         API_METHODS.POST)
    
#     data = api.apply({
#         "parameters" : {
#             "organization": "Apple"
#         }
#     })

#     print(data)


    
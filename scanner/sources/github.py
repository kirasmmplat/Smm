import requests
import time

class GitHubSource:
    def __init__(self, token=None):
        self.token = token
        self.base_url = "https://api.github.com"
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
        }
        if self.token:
            self.headers["Authorization"] = f"token {self.token}"

    def search_code(self, query):
        url = f"{self.base_url}/search/code"
        params = {"q": query, "sort": "indexed", "order": "desc"}
        
        response = requests.get(url, headers=self.headers, params=params)
        
        if response.status_code == 200:
            return response.json().get('items', [])
        elif response.status_code == 403:
            print("Rate limit exceeded. Waiting...")
            # Simple rate limit handling: wait for a minute
            time.sleep(60)
            return []
        else:
            print(f"Error: {response.status_code} - {response.text}")
            return []

    def get_file_content(self, raw_url):
        response = requests.get(raw_url)
        if response.status_code == 200:
            return response.text
        return None

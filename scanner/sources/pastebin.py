import requests
from bs4 import BeautifulSoup

class PastebinSource:
    def __init__(self):
        self.base_url = "https://pastebin.com"

    def get_recent_pastes(self):
        url = f"{self.base_url}/archive"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        response = requests.get(url, headers=headers)
        pastes = []
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            # This is a bit fragile as Pastebin might change their HTML
            table = soup.find('table', class_='maintable')
            if table:
                rows = table.find_all('tr')[1:] # Skip header
                for row in rows:
                    cols = row.find_all('td')
                    if cols:
                        link = cols[0].find('a')
                        if link:
                            pastes.append({
                                'id': link['href'].replace('/', ''),
                                'url': self.base_url + link['href'],
                                'raw_url': f"{self.base_url}/raw{link['href']}"
                            })
        return pastes

    def get_paste_content(self, raw_url):
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        response = requests.get(raw_url, headers=headers)
        if response.status_code == 200:
            return response.text
        return None

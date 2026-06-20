import subprocess
import json
import os
import uuid
from scanner.detector import Detector
from scanner.sources.github import GitHubSource
from scanner.sources.pastebin import PastebinSource

class ScannerApp:
    def __init__(self):
        self.detector = Detector()
        self.github = GitHubSource(token=os.getenv("GITHUB_TOKEN"))
        self.pastebin = PastebinSource()
        
    def run_sql(self, sql):
        try:
            # We need to escape single quotes in SQL values
            result = subprocess.check_output(['team-db', sql], stderr=subprocess.STDOUT)
            return json.loads(result)
        except subprocess.CalledProcessError as e:
            print(f"SQL Error: {e.output.decode()}")
            return None

    def save_finding(self, finding):
        # Escape single quotes in values
        val = finding['value'].replace("'", "''")
        source = finding['source'].replace("'", "''")
        type_ = finding['type'].replace("'", "''")
        id_ = str(uuid.uuid4())
        
        sql = f"""
        INSERT INTO secrets (id, type, value, source_url, status)
        VALUES ('{id_}', '{type_}', '{val}', '{source}', 'pending')
        """
        self.run_sql(sql)

    def scan_github(self, queries):
        for query in queries:
            print(f"Scanning GitHub for: {query}")
            items = self.github.search_code(query)
            for item in items:
                repo_name = item['repository']['full_name']
                file_path = item['path']
                # Try to get raw content
                raw_url = f"https://raw.githubusercontent.com/{repo_name}/master/{file_path}"
                
                content = self.github.get_file_content(raw_url)
                if content:
                    results = self.detector.scan(content)
                    for res in results:
                        finding = {
                            'source': item['html_url'],
                            'type': res['type'],
                            'value': res['value']
                        }
                        print(f"Found {res['type']} in {item['html_url']}")
                        self.save_finding(finding)

    def scan_pastebin(self):
        print("Scanning Pastebin recent pastes...")
        pastes = self.pastebin.get_recent_pastes()
        for paste in pastes:
            content = self.pastebin.get_paste_content(paste['raw_url'])
            if content:
                results = self.detector.scan(content)
                for res in results:
                    finding = {
                        'source': paste['url'],
                        'type': res['type'],
                        'value': res['value']
                    }
                    print(f"Found {res['type']} in {paste['url']}")
                    self.save_finding(finding)

if __name__ == "__main__":
    app = ScannerApp()
    # app.scan_github(["filename:.env", "extension:py AWS_SECRET_ACCESS_KEY"])
    # app.scan_pastebin()
    print("Scanner initialized.")

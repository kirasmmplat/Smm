import re

class Detector:
    def __init__(self):
        self.patterns = {
            'AWS Access Key': r'AKIA[0-9A-Z]{16}',
            'AWS Secret Key': r'[^A-Za-z0-9+/][A-Za-z0-9+/]{40}[^A-Za-z0-9+/]',
            'Google API Key': r'AIza[0-9A-Za-z-_]{35}',
            'GitHub Personal Access Token': r'ghp_[0-9a-zA-Z]{36}',
            'GitHub OAuth Token': r'gho_[0-9a-zA-Z]{36}',
            'Slack Token': r'xox[baprs]-[0-9a-zA-Z]{10,48}',
            'OpenAI API Key': r'sk-[0-9a-zA-Z]{48}',
            'Stripe Restricted Key': r'rk_live_[0-9a-zA-Z]{24}',
            'Stripe Secret Key': r'sk_live_[0-9a-zA-Z]{24}',
        }

    def scan(self, content):
        findings = []
        for name, pattern in self.patterns.items():
            matches = re.finditer(pattern, content)
            for match in matches:
                findings.append({
                    'type': name,
                    'value': match.group().strip(),
                    'start': match.start(),
                    'end': match.end()
                })
        return findings

if __name__ == "__main__":
    detector = Detector()
    test_content = "Here is an AWS key: AKIAIOSFODNN7EXAMPLE and a secret: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
    results = detector.scan(test_content)
    for res in results:
        print(f"Found {res['type']}: {res['value']}")

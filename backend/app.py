from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
import json

app = Flask(__name__)
CORS(app)

def get_agent_url(github_url):
    return 'https://api.letta.com/v1/agents/agent-64aac2ec-8a52-433d-a12e-e2f39771179a'

AGENT_URL = get_agent_url("")
LETTA_API_KEY = os.getenv("LETTA_API_KEY")
print(LETTA_API_KEY)

# Store generated documentation in memory (in production, use a database)
documentation_store = {}

@app.route('/repo', methods=['POST'])
def handle_repo():
    data = request.get_json()

    # Check if required keys exist
    if not data or 'repoUrl' not in data:
        return jsonify({"error": "Invalid input"}), 400

    repo_url = data['repoUrl'].strip()
    conf_url = data.get('confUrl', '').strip()  # Optional now

    # Log or process the received URLs
    print(f"Received repoUrl: {repo_url}")
    print(f"Received confUrl: {conf_url}")

    # Build request to AGENT_URL/messages

    payload = {
        "messages": [
            {
                "role": "user",
                "content": f"Given this repo: {repo_url}, create an internal documentation for this repo that can be used by the developers of this company? Focus on the implementation details and specifically on the details that would be a part of the internal documentation. A use case of this would be knowledge transfer. Give me a comprehensive, in-depth and detailed version of the documentation. I want the whole documentation in plain text only. Remember this very well as in the letta AI where Im giving this prompt, many things like copy code button, markdown and code is being generated. With the complete documentation which is being generated, I want the high level features to be generated too from the codebase, if there exists any, which form the basis of the code which explain the few core features of the codebase and also its purpose that the code serves. After the feature listing and everything is done stop then and there, do not generate the last sentence where you print the summary of the project."
            }
        ]
    }

    headers = {
        "Authorization": "Bearer sk-let-OWZkNmUyMzUtNGMxNC00NDFhLThlMmYtOTNiN2M3NzRhNTVmOmFkNzZiZDdhLTllYzMtNDg5My1iZTlmLWJjYzNmMzg0MzA1MQ==",
        "Content-Type": "application/json"
    }

    try:
        # Stream the response
        agent_response = requests.post(
            f"{AGENT_URL}/messages",
            headers=headers,
            json=payload,
            timeout=600,
            stream=True  # <-- Streaming enabled
        )
        agent_response.raise_for_status()

        # Read the streamed lines and combine them
        streamed_content = ""
        for line in agent_response.iter_lines():
            if line:
                decoded_line = line.decode('utf-8')
                streamed_content += decoded_line

        # Convert streamed content into JSON
        response_json = json.loads(streamed_content)

        # Extract assistant_message
        assistant_message = next(
            (msg["content"] for msg in response_json.get("messages", [])
             if msg.get("message_type") == "assistant_message"),
            None
        )

        if assistant_message:
            # Store the documentation for later retrieval
            documentation_store[repo_url] = assistant_message
            
            return jsonify({
                "assistantMessageContent": assistant_message,
                "repoUrl": repo_url,
                "confUrl": conf_url
            }), 200
        else:
            return jsonify({"error": "No assistant_message found in response"}), 500

    except Exception as e:
        return jsonify({"error": f"Failed to contact agent: {str(e)}"}), 500

@app.route('/documentation', methods=['POST'])
def get_documentation():
    data = request.get_json()
    
    if not data or 'repoUrl' not in data:
        return jsonify({"error": "Repository URL is required"}), 400
    
    repo_url = data['repoUrl'].strip()
    
    # Check if documentation exists for this repository
    if repo_url in documentation_store:
        # Parse the documentation into sections
        doc_content = documentation_store[repo_url]
        
        # Split the documentation into sections based on common patterns
        sections = []
        lines = doc_content.split('\n')
        current_section = None
        current_content = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Check if this line looks like a section header
            if (line.isupper() or 
                line.startswith('#') or 
                (len(line) < 100 and (line.endswith(':') or line.endswith('.')) and 
                 any(keyword in line.lower() for keyword in ['overview', 'introduction', 'setup', 'installation', 'configuration', 'usage', 'api', 'features', 'components', 'architecture', 'deployment', 'testing', 'troubleshooting']))):
                
                # Save previous section if exists
                if current_section and current_content:
                    sections.append({
                        'id': current_section.lower().replace(' ', '-').replace(':', '').replace('.', ''),
                        'title': current_section,
                        'content': '\n'.join(current_content).strip()
                    })
                
                # Start new section
                current_section = line.replace('#', '').strip()
                current_content = []
            else:
                if current_section:
                    current_content.append(line)
                else:
                    # If no section started yet, treat as overview
                    if not current_section:
                        current_section = "Overview"
                    current_content.append(line)
        
        # Add the last section
        if current_section and current_content:
            sections.append({
                'id': current_section.lower().replace(' ', '-').replace(':', '').replace('.', ''),
                'title': current_section,
                'content': '\n'.join(current_content).strip()
            })
        
        # If no sections were created, create a single section
        if not sections:
            sections = [{
                'id': 'documentation',
                'title': 'Documentation',
                'content': doc_content
            }]
        
        return jsonify({
            "documentation": {
                "title": f"Documentation for {repo_url.split('/')[-1]}",
                "content": doc_content,
                "sections": sections
            }
        }), 200
    else:
        return jsonify({"error": "Documentation not found for this repository"}), 404

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
import json
import time
from letta_client import Letta

app = Flask(__name__)
CORS(app)

# Letta API configuration
LETTA_API_KEY = "sk-let-MWFlZWY3ZmYtZTA0Yi00NzI4LTlhNDMtOTFjOWYwNjcyZmQ1OjdhYjE1MGE2LThmZjQtNDUxOS05ZjA5LWU2MmQ5NzljNDEwZQ=="

client = Letta(
    token=LETTA_API_KEY
)

# Simulated in-memory "database"
repo_agent_map = {
   #"https://github.com/ananya0996/vultra": "agent-8a28e02c-7d47-4e78-a32c-6394480ea751"
}

def get_agent_url(github_url):
    return 'https://api.letta.com/v1/agents/agent-64aac2ec-8a52-433d-a12e-e2f39771179a'

INTERNAL_AGENT_URL = get_agent_url("")
EXTERNAL_AGENT_URL = ""

def github_url_to_internal_filename(url):
    """
    Converts a GitHub project URL into a safe .txt filename using string operations.

    Example:
        https://github.com/user/project -> user_project.txt
    """
    # Remove protocol (http/https)
    if url.startswith("https://"):
        url = url[len("https://"):]
    elif url.startswith("http://"):
        url = url[len("http://"):]

    # Split the URL into parts
    parts = url.strip("/").split("/")

    # Ensure it's a GitHub project URL
    if len(parts) >= 3 and parts[0] == "github.com":
        user = parts[1]
        repo = parts[2].replace(".git", "")
        return f"internal_{user}_{repo}.txt"
    else:
        #raise ValueError("Invalid GitHub project URL")
        return "internal_random_file.txt"

def github_url_to_external_filename(url):
    """
    Converts a GitHub project URL into a safe .txt filename using string operations.

    Example:
        https://github.com/user/project -> user_project.txt
    """
    # Remove protocol (http/https)
    if url.startswith("https://"):
        url = url[len("https://"):]
    elif url.startswith("http://"):
        url = url[len("http://"):]

    # Split the URL into parts
    parts = url.strip("/").split("/")

    # Ensure it's a GitHub project URL
    if len(parts) >= 3 and parts[0] == "github.com":
        user = parts[1]
        repo = parts[2].replace(".git", "")
        return f"external_{user}_{repo}.txt"
    else:
        #raise ValueError("Invalid GitHub project URL")
        return "external_random_file.txt"

def repo_exists_in_db(repo_url):
    return repo_url in repo_agent_map

def get_agent_id_for_repo(repo_url):
    return repo_agent_map.get(repo_url)

def chat_with_agent(agent_id, user_input):
    headers = {
        "Authorization": f"Bearer {LETTA_API_KEY}",
        "Content-Type": "application/json"
    }

    # Correct endpoint format
    messages_url = f"https://api.letta.com/v1/agents/{agent_id}/messages"

    print(f"Chatting with agent: {agent_id}")
    print("You can now chat with the agent. Type 'exit' to quit.\n")

    # while True:
    #     user_input = input("You: ").strip()
    #     if user_input.lower() == "exit":
    #         break

    #     # Correct payload structure based on API docs
    payload = {
        "messages": [{"role": "user", "content": user_input}]
    }

    response = requests.post(messages_url, headers=headers, json=payload)
    
    if response.status_code != 200:
        print(f"Error: {response.status_code} - {response.text}")
        return

    try:
        response_data = response.json()
        print(f"[DEBUG] Full response: {response_data}")  # Remove this after testing
        
        # Based on API docs, response should have "messages" array
        if "messages" in response_data and len(response_data["messages"]) > 0:
            # Get the last message from the agent
            agent_messages = response_data["messages"]
            for msg in agent_messages:
                if msg.get("role") == "assistant":
                    reply = msg.get("content", str(msg))
                    break
            else:
                reply = str(response_data["messages"])
        else:
            reply = str(response_data)
        print(f"Agent: {reply}\n")
        return reply
    except Exception as e:
        print(f"Error parsing response: {e}")
        print(f"Raw response: {response.text}")

def create_internal_agent(repo_url):
    headers = {
        "Authorization": f"Bearer {LETTA_API_KEY}",
        "Content-Type": "application/json"
    }

    data_source_url = f"https://api.letta.com/v1/sources/"
    payload = {"name": repo_url[8:], "embedding": "openai/text-embedding-3-small"}

    response = requests.post(data_source_url, headers=headers, json=payload)
        
    if response.status_code != 200:
        print(f"Error: {response.status_code} - {response.text}")
        exit()
    else:
        result = response.json()
        source_id = result.get("id")
    job = client.sources.files.upload(
        source_id=source_id,
        file=open(github_url_to_internal_filename(repo_url), "rb")
    )

    # wait until the job is completed
    while True:
        job = client.jobs.retrieve(job.id)
        if job.status == "completed":
            break
        elif job.status == "failed":
            raise ValueError(f"Job failed: {job.metadata}")
        print(f"Job status: {job.status}")
        time.sleep(1)

    # Correct endpoint format
    messages_url = f"https://api.letta.com/v1/agents/"
    payload = {
            "memory_blocks": [{"value": '''## Persona
You are DocBot, a focused AI assistant that specializes in answering questions based on internal technical documentation.

## Purpose
Your role is to help developers understand internal documentation, explain components, and clarify architectural decisions. You are not allowed to answer questions unrelated to this documentation.

## Guardrails
- Do not answer unrelated questions (e.g., general knowledge, pop culture, jokes).
- Politely decline when asked something off-topic.
- Always refer to the source documentation to generate answers.
- Avoid hallucinating or guessing — if the answer isn't in the documentation, say so.

## Tone
Professional, concise, helpful, and strictly on-topic.
''', "label": "persona", "description": "I am an assistant trained specifically on internal documentation."}]
,"source_ids": [source_id]}

    response = requests.post(messages_url, headers=headers, json=payload)
        
    if response.status_code != 201:
        print(f"Error: {response.status_code} - {response.text}")
    else:
        print("Agent should be created")
        result = response.json()
        agent_id = result.get("id")
        repo_agent_map[repo_url] = agent_id
        return agent_id

# Example usage:
# print(github_url_to_filename("https://github.com/psf/requests"))  # psf_requests.txt

@app.route('/chat_with_agent', methods=['GET'])
def handle_chat_with_agent():
    data = request.get_json()
    user_input = data['userInput'].strip()
    repo_url = data['repoUrl'].strip()
    if repo_exists_in_db(repo_url):
        agent_id = get_agent_id_for_repo(repo_url)
        print(f"Found existing agent for {repo_url}")
        print(f"Agent ID: {agent_id}")
        chat_with_agent(agent_id)
    else:
        agent_id = create_internal_agent(repo_url)
        print(f"Cretaed New agent for {repo_url}")
        print(f"Agent ID: {agent_id}")
        chat_with_agent(agent_id)
    return chat_with_agent(agent_id, user_input)


@app.route('/internal_repo', methods=['POST'])
def handle_internal_repo():
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
            f"{INTERNAL_AGENT_URL}/messages",
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
            with open(github_url_to_internal_filename(repo_url), "w") as datasrc_file:
                datasrc_file.write(assistant_message)
            return jsonify({
                "assistantMessageContent": assistant_message,
                "repoUrl": repo_url,
                "confUrl": conf_url
            }), 200
        else:
            return jsonify({"error": "No assistant_message found in response"}), 500

    except Exception as e:
        return jsonify({"error": f"Failed to contact agent: {str(e)}"}), 500

@app.route('/external_repo', methods=['POST'])
def handle_external_repo():
    data = request.get_json()

    # Check if required keys exist
    if not data or 'repoUrl' not in data or 'confUrl' not in data:
        return jsonify({"error": "Invalid input"}), 400

    repo_url = data['repoUrl'].strip()
    conf_url = data['confUrl'].strip()

    # Log or process the received URLs
    print(f"Received repoUrl: {repo_url}")
    print(f"Received confUrl: {conf_url}")

    # Build request to AGENT_URL/messages

    payload = {
        "messages": [
            {
                "role": "user",
                "content": f"TODO NEW PROMPT"
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
            f"{EXTERNAL_AGENT_URL}/messages",
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
            with open(github_url_to_external_filename(repo_url), "w") as datasrc_file:
                datasrc_file.write(assistant_message)
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
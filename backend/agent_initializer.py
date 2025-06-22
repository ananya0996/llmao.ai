import os, time
import requests
from letta_client import Letta
from app import github_url_to_filename
LETTA_API_KEY = "sk-let-MWFlZWY3ZmYtZTA0Yi00NzI4LTlhNDMtOTFjOWYwNjcyZmQ1OjdhYjE1MGE2LThmZjQtNDUxOS05ZjA5LWU2MmQ5NzljNDEwZQ=="

client = Letta(
    token=LETTA_API_KEY
)

# Simulated in-memory "database"
repo_agent_map = {
   #"https://github.com/ananya0996/vultra": "agent-8a28e02c-7d47-4e78-a32c-6394480ea751"
}

def repo_exists_in_db(repo_url):
    return repo_url in repo_agent_map

def get_agent_id_for_repo(repo_url):
    return repo_agent_map.get(repo_url)

def chat_with_agent(agent_id):
    headers = {
        "Authorization": f"Bearer {LETTA_API_KEY}",
        "Content-Type": "application/json"
    }

    # Correct endpoint format
    messages_url = f"https://api.letta.com/v1/agents/{agent_id}/messages"

    print(f"Chatting with agent: {agent_id}")
    print("You can now chat with the agent. Type 'exit' to quit.\n")

    while True:
        user_input = input("You: ").strip()
        if user_input.lower() == "exit":
            break

        # Correct payload structure based on API docs
        payload = {
            "messages": [{"role": "user", "content": user_input}]
        }

        response = requests.post(messages_url, headers=headers, json=payload)
        
        if response.status_code != 200:
            print(f"Error: {response.status_code} - {response.text}")
            continue

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
            
        except Exception as e:
            print(f"Error parsing response: {e}")
            print(f"Raw response: {response.text}")

def create_agent(repo_url):
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
        file=open(github_url_to_filename(repo_url), "rb")
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

if __name__ == "__main__":
    repo_url = "https://github.com/ananya0996/vultra"
    
    if repo_exists_in_db(repo_url):
        agent_id = get_agent_id_for_repo(repo_url)
        print(f"Found existing agent for {repo_url}")
        print(f"Agent ID: {agent_id}")
        chat_with_agent(agent_id)
    else:
        agent_id = create_agent(repo_url)
        print(f"Cretaed New agent for {repo_url}")
        print(f"Agent ID: {agent_id}")
        chat_with_agent(agent_id)
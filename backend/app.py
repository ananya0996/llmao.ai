from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/repo', methods=['POST'])
def handle_repo():
    data = request.get_json()

    # Check if required keys exist
    if not data or 'repoUrl' not in data or 'confUrl' not in data:
        return jsonify({"error": "Invalid input"}), 400

    repo_url = data['repoUrl'].strip()
    conf_url = data['confUrl'].strip()

    # Log or process the received URLs
    print(f"Received repoUrl: {repo_url}")
    print(f"Received confUrl: {conf_url}")

    # You can now clone the repo, fetch the config, etc.

    return jsonify({"message": "URLs received successfully", "repoUrl": repo_url, "confUrl": conf_url}), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

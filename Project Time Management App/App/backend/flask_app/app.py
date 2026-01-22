from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)

# CORS: allow GitHub Pages + local dev
CORS(
    app,
    resources={r"/api/*": {"origins": [
        "https://ssethx24.github.io",
        "http://localhost:3000",
        "http://localhost:3001"
    ]}}
)

# Users dictionary with email as key and password/role as values
users = {
    "scrummaster@gmail.com": {"password": "1234", "role": "scrum-master"},
    "team@gmail.com": {"password": "4321", "role": "team-member"}
}


@app.route('/api/login', methods=['POST'])
def login():
    # Get login data from request
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')

    # Validate user credentials
    user = users.get(email)
    if user and user['password'] == password:
        return jsonify({'message': 'Login successful!', 'role': user['role']}), 200

    return jsonify({'message': 'Invalid credentials'}), 401


@app.route('/api/users', methods=['GET'])
def get_users():
    # Return a list of users with their emails and roles (without passwords)
    return jsonify([{'email': k, 'role': v['role']} for k, v in users.items()]), 200


@app.route('/api/users', methods=['POST'])
def add_user():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'message': 'email and password are required'}), 400

    # Check if user already exists
    if email in users:
        return jsonify({'message': 'User already exists'}), 409

    # Add new user with default role as 'team-member'
    users[email] = {'password': password, 'role': 'team-member'}

    return jsonify({'message': 'User added successfully'}), 201


@app.route('/api/users/<path:email>', methods=['DELETE'])
def delete_user(email):
    if email in users:
        del users[email]
        return jsonify({'message': 'User deleted successfully'}), 200

    return jsonify({'message': 'User not found'}), 404


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


if __name__ == '__main__':
    # Local dev only (Render will run gunicorn)
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)  # Optional if you deploy frontend+backend together, but safe to keep

# Users dictionary with email as key and password/role as values
users = {
    "scrummaster@gmail.com": {"password": "1234", "role": "scrum-master"},
    "team@gmail.com": {"password": "4321", "role": "team-member"}
}


@app.route('/api/login', methods=['POST'])
def login():
    # Get login data from request
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    # Validate user credentials
    user = users.get(email)
    if user and user['password'] == password:
        # Successful login
        return jsonify({'message': 'Login successful!', 'role': user['role']}), 200
    # Invalid credentials
    return jsonify({'message': 'Invalid credentials'}), 401


@app.route('/api/users', methods=['GET'])
def get_users():
    # Return a list of users with their emails and roles (without passwords)
    return jsonify([{'email': k, 'role': v['role']} for k, v in users.items()])


@app.route('/api/users', methods=['POST'])
def add_user():
    # Add a new user to the system
    data = request.get_json()
    email = data.get('email')

    # Check if user already exists
    if email in users:
        return jsonify({'message': 'User already exists'}), 409

    # Add new user with default role as 'team-member'
    users[email] = {'password': data.get('password'), 'role': 'team-member'}
    print(users)  # Debug: Print users dictionary to see if it is updated

    # Return success message with updated users list
    return jsonify({'message': 'User added successfully', 'users': users}), 201


@app.route('/api/users/<email>', methods=['DELETE'])
def delete_user(email):
    # Delete the specified user if they exist
    if email in users:
        del users[email]
        return jsonify({'message': 'User deleted successfully'}), 200
    # User not found
    return jsonify({'message': 'User not found'}), 404


# Serve React build (for single deploy)
BUILD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "build")


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    # Let API routes 404 properly
    if path.startswith("api/"):
        return jsonify({"error": "Not found"}), 404

    file_path = os.path.join(BUILD_DIR, path)
    if path and os.path.exists(file_path):
        return send_from_directory(BUILD_DIR, path)
    return send_from_directory(BUILD_DIR, "index.html")


if __name__ == '__main__':
    # Run the Flask app in debug mode (local only)
    app.run(debug=True)

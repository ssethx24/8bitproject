from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing (CORS) for communication with React frontend

# Users dictionary with email as key and password/role as values
users = {
    "scrummaster@gmail.com": {"password": "1234", "role": "scrum-master"},
    "team@gmail.com": {"password": "4321", "role": "team-member"}
}

@app.route('/login', methods=['POST'])
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


@app.route('/users', methods=['GET'])
def get_users():
    # Return a list of users with their emails and roles (without passwords)
    return jsonify([{'email': k, 'role': v['role']} for k, v in users.items()])


@app.route('/users', methods=['POST'])
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


@app.route('/users/<email>', methods=['DELETE'])
def delete_user(email):
    # Delete the specified user if they exist
    if email in users:
        del users[email]
        return jsonify({'message': 'User deleted successfully'}), 200
    # User not found
    return jsonify({'message': 'User not found'}), 404

if __name__ == '__main__':
    # Run the Flask app in debug mode
    app.run(debug=True)

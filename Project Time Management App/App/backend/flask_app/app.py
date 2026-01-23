import os
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)

# -------------------------
# CORS: allow GitHub Pages + local dev
# -------------------------
CORS(
    app,
    resources={r"/api/*": {"origins": [
        "https://ssethx24.github.io",
        "http://localhost:3000",
        "http://localhost:3001"
    ]}}
)

# -------------------------
# Database Config
# -------------------------
DATABASE_URL = os.environ.get("DATABASE_URL")

# Local fallback (optional) if DATABASE_URL not set
if not DATABASE_URL:
    DATABASE_URL = "sqlite:///local.db"

# Render sometimes provides postgres:// but SQLAlchemy expects postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# -------------------------
# Model
# -------------------------
class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), nullable=False, default="team-member")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_public(self):
        return {"email": self.email, "role": self.role}


# -------------------------
# Init DB + seed default users
# -------------------------
def seed_default_users():
    defaults = [
        ("scrummaster@gmail.com", "1234", "scrum-master"),
        ("team@gmail.com", "4321", "team-member")
    ]

    for email, password, role in defaults:
        existing = User.query.filter_by(email=email).first()
        if not existing:
            db.session.add(
                User(
                    email=email,
                    password_hash=generate_password_hash(password),
                    role=role
                )
            )
    db.session.commit()


with app.app_context():
    db.create_all()
    seed_default_users()

# -------------------------
# Routes
# -------------------------
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""

    user = User.query.filter_by(email=email).first()

    if user and check_password_hash(user.password_hash, password):
        return jsonify({"message": "Login successful!", "role": user.role}), 200

    return jsonify({"message": "Invalid credentials"}), 401


@app.route("/api/users", methods=["GET"])
def get_users():
    users = User.query.order_by(User.created_at.asc()).all()
    return jsonify([u.to_public() for u in users]), 200


@app.route("/api/users", methods=["POST"])
def add_user():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"message": "email and password are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"message": "User already exists"}), 409

    new_user = User(
        email=email,
        password_hash=generate_password_hash(password),
        role="team-member"
    )

    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User added successfully"}), 201


@app.route("/api/users/<path:email>", methods=["DELETE"])
def delete_user(email):
    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({"message": "User not found"}), 404

    # Optional safety: don't delete scrum master
    if "scrummaster" in user.email:
        return jsonify({"message": "Cannot delete scrum master"}), 403

    db.session.delete(user)
    db.session.commit()

    return jsonify({"message": "User deleted successfully"}), 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)

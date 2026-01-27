import os
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

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

# -------------------------
# Database Config
# -------------------------
DATABASE_URL = os.environ.get("DATABASE_URL")

# Local fallback (optional)
if not DATABASE_URL:
    DATABASE_URL = "sqlite:///local.db"

# Render sometimes provides postgres:// but SQLAlchemy expects postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# -------------------------
# Models
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


class Task(db.Model):
    __tablename__ = "tasks"
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    priority = db.Column(db.String(50), default="Medium")
    status = db.Column(db.String(50), default="Awaiting Action")
    assigned_to = db.Column(db.String(255), nullable=True)  # developer email/name
    time_spent = db.Column(db.Float, default=0)
    sprint = db.Column(db.String(50), default="Backlog")  # Backlog, Sprint1, Sprint2, Sprint3
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "priority": self.priority,
            "status": self.status,
            "assignedTo": self.assigned_to,
            "timeSpent": self.time_spent,
            "sprint": self.sprint,
        }

# -------------------------
# Seed default users
# -------------------------
def seed_default_users():
    defaults = [
        ("scrummaster@gmail.com", "1234", "scrum-master"),
        ("team@gmail.com", "4321", "team-member"),
    ]

    for email, password, role in defaults:
        existing = User.query.filter_by(email=email).first()
        if not existing:
            db.session.add(User(
                email=email,
                password_hash=generate_password_hash(password),
                role=role
            ))
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


# ---------- LOGIN ----------
@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""

    user = User.query.filter_by(email=email).first()
    if user and check_password_hash(user.password_hash, password):
        return jsonify({"message": "Login successful!", "role": user.role}), 200

    return jsonify({"message": "Invalid credentials"}), 401


# ---------- USERS ----------
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

    # Optional: protect scrummaster
    if "scrummaster" in user.email:
        return jsonify({"message": "Cannot delete scrum master"}), 403

    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted successfully"}), 200


# ---------- TASKS (Product Backlog + Sprints) ----------
@app.route("/api/tasks", methods=["GET"])
def get_tasks():
    sprint = request.args.get("sprint")  # optional filter
    q = Task.query
    if sprint:
        q = q.filter_by(sprint=sprint)

    tasks = q.order_by(Task.created_at.asc()).all()
    return jsonify([t.to_dict() for t in tasks]), 200


@app.route("/api/tasks", methods=["POST"])
def create_task():
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()

    if not title:
        return jsonify({"message": "title is required"}), 400

    task = Task(
        title=title,
        priority=data.get("priority", "Medium"),
        status=data.get("status", "Awaiting Action"),
        assigned_to=data.get("assignedTo"),  # developer
        time_spent=float(data.get("timeSpent", 0) or 0),
        sprint=data.get("sprint", "Backlog")
    )

    db.session.add(task)
    db.session.commit()
    return jsonify(task.to_dict()), 201


@app.route("/api/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"message": "Task not found"}), 404

    data = request.get_json() or {}

    if "title" in data:
        task.title = data["title"]
    if "priority" in data:
        task.priority = data["priority"]
    if "status" in data:
        task.status = data["status"]
    if "assignedTo" in data:
        task.assigned_to = data["assignedTo"]
    if "timeSpent" in data:
        task.time_spent = float(data["timeSpent"] or 0)
    if "sprint" in data:
        task.sprint = data["sprint"]

    db.session.commit()
    return jsonify(task.to_dict()), 200


@app.route("/api/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"message": "Task not found"}), 404

    db.session.delete(task)
    db.session.commit()
    return jsonify({"message": "Task deleted"}), 200


if __name__ == "__main__":
    # Local dev only (Render will run gunicorn)
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
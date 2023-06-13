Overview
The Geo Dashboard Project is a sophisticated geographical information system that allows users to view, analyze, and manipulate spatial data through a visually appealing interface. It is built with cutting-edge technologies: the frontend utilizes React, Deck.gl, Maplibre, and Framer Motion, while the backend is powered by Python, Django, and Martin. The project data is stored in a PostgreSQL database and the infrastructure is based on Kubernetes.

Prerequisites
To work with this project, ensure you have installed the following tools:
```
Node.js
npm
Python 3
Django
PostgreSQL
Docker
Kubernetes
A modern web browser (Chrome, Firefox, Safari, etc.)
```
Getting Started
Clone the repository:
```
bash
Copy code
git clone https://github.com/tardis-pro/maps.tardis.digital
```
Navigate into the project directory:

bash
Copy code
cd maps.tardis.digital
Set up the Python environment:

We recommend using a virtual environment to manage dependencies. You can set it up using the following commands:

bash
```
python3 -m venv venv
source venv/bin/activate
Install Python dependencies with:

Copy code
pip install -r requirements.txt
Set up the Node.js environment:
```
Navigate to the frontend directory:

bash
```
cd frontend
Install Node.js dependencies with:

Copy code
npm install
Create a .env file:
```
You should have a .env file to store your environment variables. Use the .env.example file in the root directory as a base.
Set up the Database:

Make sure you have PostgreSQL running on your local machine or use a Docker container for the same.
Run migrations to create the database schema:

```
python manage.py migrate
Build and run the project locally:

Frontend:

npm start
```
Backend:
```
python manage.py runserver
Deploying to Kubernetes
We use Docker for containerization and Kubernetes for orchestration.
```
Build Docker images:

bash
```
docker build -t geo-dashboard-frontend ./frontend
docker build -t geo-dashboard-backend ./backend
Push Docker images to a registry:

bash

docker tag geo-dashboard-frontend:latest yourusername/geo-dashboard-frontend:latest
docker push yourusername/geo-dashboard-frontend:latest

docker tag geo-dashboard-backend:latest yourusername/geo-dashboard-backend:latest
docker push yourusername/geo-dashboard-backend:latest
```
Deploy to Kubernetes:

Make sure you have a running Kubernetes cluster and kubectl is configured to interact with it.
Apply the Kubernetes configuration:
```
kubectl apply -f infra/core/
kubectl apply -f infra/database/
kubectl apply -f infra/tiler/

```
Documentation
For more detailed documentation, please check out the docs folder in the repository. It provides more in-depth information about each component of the project, coding guidelines, and contribution guidelines.

Contributions
We welcome contributions! Please see our CONTRIBUTING.md for details on how to get started with contributing to the project. Always abide by our code of conduct.

License
This project is licensed under the terms of the MIT license. See the LICENSE file for the full license text.

Support
For any queries or support-related questions, please contact us at support@geodashboard.com or

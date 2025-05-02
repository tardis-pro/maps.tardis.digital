# Maps Platform Backend

The backend service for the Maps Platform, providing APIs for map data management and processing.

## Features

- RESTful API endpoints
- Geospatial data processing
- User authentication and authorization
- Database management
- Tile serving capabilities

## Tech Stack

- Python 3.11+
- FastAPI
- SQLAlchemy
- PostGIS
- Pydantic
- Alembic

## Getting Started

### Prerequisites

- Python 3.11+
- PostgreSQL 14+ with PostGIS
- Redis (optional, for caching)

### Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Environment Variables

Create a `.env` file with the following variables:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/maps
REDIS_URL=redis://localhost:6379
SECRET_KEY=your_secret_key
```

## Development

### Project Structure

```
backend/
├── app/
│   ├── api/           # API endpoints
│   ├── core/          # Core functionality
│   ├── db/            # Database models and migrations
│   ├── services/      # Business logic
│   └── utils/         # Utility functions
├── tests/             # Test files
├── alembic/           # Database migrations
└── requirements/      # Dependency files
```

### Available Commands

```bash
# Run development server
uvicorn app.main:app --reload

# Run tests
pytest

# Run database migrations
alembic upgrade head

# Generate new migration
alembic revision --autogenerate -m "description"
```

## API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Testing

```bash
# Run all tests
pytest

# Run tests with coverage
pytest --cov=app tests/

# Run specific test file
pytest tests/test_api.py
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the BSD 3-Clause License - see the [LICENSE](../LICENSE) file for details. 
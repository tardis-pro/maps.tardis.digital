# Maps Platform

A modern, scalable platform for serving and managing geospatial data.

## Overview

The Maps Platform is a comprehensive solution for serving and managing geospatial data, featuring a modern web interface, robust backend services, and scalable infrastructure.

## Project Structure

```
.
├── frontend/          # React-based web application
├── backend/           # FastAPI-based backend service
└── infra/            # Kubernetes infrastructure
```

## Quick Start

1. **Set up Infrastructure**
   ```bash
   cd infra
   # Follow instructions in infra/README.md
   ```

2. **Start Backend Service**
   ```bash
   cd backend
   # Follow instructions in backend/README.md
   ```

3. **Launch Frontend Application**
   ```bash
   cd frontend
   # Follow instructions in frontend/README.md
   ```

## Development

Each component has its own development setup and documentation. Please refer to the respective README files:

- [Frontend Documentation](frontend/README.md)
- [Backend Documentation](backend/README.md)
- [Infrastructure Documentation](infra/README.md)

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the BSD 3-Clause License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Protomaps](https://protomaps.com/) - Original inspiration and some components
- [MapLibre GL JS](https://maplibre.org/) - Map rendering library
- [FastAPI](https://fastapi.tiangolo.com/) - Modern web framework
- [PostGIS](https://postgis.net/) - Geospatial database extension

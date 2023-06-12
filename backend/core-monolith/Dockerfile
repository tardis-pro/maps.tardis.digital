# Dockerfile
FROM python:3.9

ENV PYTHONUNBUFFERED 1

WORKDIR /app

COPY requirements.txt /app/

RUN pip install -r requirements.txt

COPY . /app/
CMD ["gunicorn", "dashboard.wsgi:application", "--bind", "0.0.0.0:8000"]

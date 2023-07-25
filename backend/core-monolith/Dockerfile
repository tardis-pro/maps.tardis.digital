# Dockerfile
FROM python:3.10

ENV PYTHONUNBUFFERED 1

WORKDIR /app

COPY dashboard/requirements.txt /app/
RUN apt-get update \
    && apt-get install -y binutils libproj-dev gdal-bin  libgdal-dev python3-gdal \
    && apt-get clean -y
ENV CPLUS_INCLUDE_PATH=/usr/include/gdal
ENV C_INCLUDE_PATH=/usr/include/gdal
RUN pip3 install setuptools==58
RUN pip3 install -r requirements.txt
COPY . /app/
WORKDIR /app/dashboard
RUN cp /app/sample.env /app/.env
RUN chmod 600 /app/.env
RUN chmod +x ./init.sh
ENTRYPOINT ["./init.sh"]
CMD ["gunicorn", "dashboard.wsgi:application", "--bind", "0.0.0.0:8000"]
# CMD ["python3", "manage.py", "migrate", ""]
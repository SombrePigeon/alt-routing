FROM httpd as base
EXPOSE 80

#DEV-----------
FROM base as dev
ENV VIRTUAL_HOST=training.localhost
ENV LETSENCRYPT_HOST=training.localhost

#PROD----------
FROM base as prod
ENV VIRTUAL_HOST=training.fenrir.ovh
ENV LETSENCRYPT_HOST=training.fenrir.ovh

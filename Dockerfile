FROM serversideup/php:8.2-fpm-nginx

# Habilitar Opcache
ENV PHP_OPCACHE_ENABLE=1

# Instalar dependencias como root
USER root

RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copiar archivos con el usuario correcto (www-data)
COPY --chown=www-data:www-data . /var/www/html

# Cambiar al usuario www-data para instalar dependencias y construir
USER www-data

# Instalar dependencias de PHP
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Instalar dependencias de Node y compilar assets
RUN npm install && npm run build
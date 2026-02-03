FROM serversideup/php:8.2-fpm-nginx

# Habilitar Opcache para rendimiento
ENV PHP_OPCACHE_ENABLE=1

# Pasamos a root para instalaciones del sistema
USER root

# 1. Instalar dependencias básicas y Node.js
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Descargamos el script oficial 'install-php-extensions' que gestiona la compatibilidad
ADD https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions /usr/local/bin/

# Le damos permisos y ejecutamos la instalación de 'exif'
RUN chmod +x /usr/local/bin/install-php-extensions && \
    install-php-extensions exif gd zip intl bcmath

# Copiar archivos del proyecto
COPY --chown=www-data:www-data . /var/www/html

# Cambiar al usuario www-data (seguridad)
USER www-data

# Instalar dependencias de PHP
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Instalar dependencias de Frontend y compilar
RUN npm install && npm run build
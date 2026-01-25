# Usamos una imagen optimizada para Laravel con Nginx + PHP 8.2 ya configurados
FROM serversideup/php:8.2-fpm-nginx

# Variables de entorno para optimización
ENV PHP_OPCACHE_ENABLE=1
ENV WEBUSER_HOME="/var/www/html"

# Pasamos a root para instalar dependencias del sistema
USER root

# Instalamos Node.js (necesario para compilar tus assets con Vite)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Volvemos al usuario seguro de la imagen
USER webuser

# Copiamos el código del proyecto
COPY --chown=webuser:webuser . /var/www/html

# Instalamos dependencias de PHP (Composer)
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Instalamos dependencias de Frontend y compilamos (Vite)
RUN npm install && npm run build
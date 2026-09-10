FROM nginx:alpine

# Copy custom nginx configuration
COPY conf.d/*.conf /etc/nginx/conf.d/

# Create ssl directory
RUN mkdir -p /etc/nginx/ssl

# Expose ports
EXPOSE 80 443

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
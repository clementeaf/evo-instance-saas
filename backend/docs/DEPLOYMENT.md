# Deployment Guide

Quick deployment guide for production.

## Railway (Recommended)

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

## Docker

```bash
docker build -t whatsapp-saas .
docker run -p 8200:8200 --env-file .env whatsapp-saas
```

## Production Checklist

- [ ] Set NODE_ENV=production
- [ ] Configure HTTPS/SSL
- [ ] Set up DynamoDB tables
- [ ] Configure RDS for Evolution API
- [ ] Set up monitoring (Sentry)
- [ ] Configure backups
- [ ] Enable rate limiting with Redis

See [ENVIRONMENT.md](./ENVIRONMENT.md) for configuration details.

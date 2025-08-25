#!/bin/bash

# Build the React application
npm run build

# Deploy to a hosting service (example: Netlify)
# Replace 'your-site-name' with your actual site name
netlify deploy --prod --site your-site-name

# Alternatively, if using Vercel
# vercel --prod

echo "Deployment completed!"
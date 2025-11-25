// Configuration for the application
export const config = {
  // API Configuration
  API_URL: process.env.API_URL,
  
  // AWS Cognito Configuration
  AWS_REGION: process.env.AWS_REGION,
  AWS_COGNITO_POOL_ID: process.env.AWS_COGNITO_POOL_ID ,
  AWS_COGNITO_CLIENT_ID: process.env.AWS_COGNITO_CLIENT_ID,
  OAUTH_SIGN_IN_REDIRECT_URL: process.env.OAUTH_SIGN_IN_REDIRECT_URL ,
};

// Log the configuration
console.log('App Config:', config);

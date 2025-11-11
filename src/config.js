// Configuration for the application
export const config = {
  // API Configuration
  API_URL: 'http://ec2-54-237-216-221.compute-1.amazonaws.com:8080',
  
  // AWS Cognito Configuration
  AWS_REGION: 'us-east-1',
  AWS_COGNITO_POOL_ID: 'us-east-1_mWEmrcXtI',
  AWS_COGNITO_CLIENT_ID: '8o2l6geft81bg9dajjaqtuicj',
  OAUTH_SIGN_IN_REDIRECT_URL: 'http://localhost:1234',
};

// Log the configuration
console.log('App Config:', config);

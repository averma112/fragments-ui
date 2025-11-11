// src/auth.js
import { UserManager } from 'oidc-client-ts';
import { config } from './config';

const cognitoAuthConfig = {
  authority: `https://cognito-idp.${config.AWS_REGION}.amazonaws.com/${config.AWS_COGNITO_POOL_ID}`,
  client_id: config.AWS_COGNITO_CLIENT_ID,
  redirect_uri: config.OAUTH_SIGN_IN_REDIRECT_URL,
  response_type: 'code',
  scope: 'phone openid email',
  revokeTokenTypes: ['refresh_token'],
  automaticSilentRenew: false,
};

console.log('Cognito Config:', cognitoAuthConfig);

const userManager = new UserManager({
  ...cognitoAuthConfig,
});

export async function signIn() {
  await userManager.signinRedirect();
}

function formatUser(user) {
  console.log('User Authenticated', { user });
  return {
    username: user.profile['cognito:username'],
    email: user.profile.email,
    idToken: user.id_token,
    accessToken: user.access_token,
    authorizationHeaders: (type = 'application/json') => ({
      'Content-Type': type,
      Authorization: `Bearer ${user.id_token}`,
    }),
  };
}

export async function getUser() {
  if (window.location.search.includes('code=')) {
    const user = await userManager.signinCallback();
    window.history.replaceState({}, document.title, window.location.pathname);
    return formatUser(user);
  }

  const user = await userManager.getUser();
  return user ? formatUser(user) : null;
}

/**
 * Sign out the current user
 */
export async function signOut() {
  try {
    await userManager.removeUser();
    // Redirect to Cognito logout endpoint
    window.location.href = `https://fragments-cognito-domain.auth.us-east-1.amazoncognito.com/logout?client_id=${cognitoAuthConfig.client_id}&logout_uri=${encodeURIComponent(window.location.origin)}`;
  } catch (error) {
    console.error('Error during sign out:', error);
    throw error;
  }
}

/**
 * Get the current user's ID token
 * @returns {Promise<string|null>} The ID token or null if not authenticated
 */
export async function getIdToken() {
  const user = await userManager.getUser();
  return user?.id_token || null;
}

/**
 * Get the current user's access token
 * @returns {Promise<string|null>} The access token or null if not authenticated
 */
export async function getAccessToken() {
  const user = await userManager.getUser();
  return user?.access_token || null;
}
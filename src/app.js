// src/app.js

import { signIn, getUser } from './auth';
import { createFragment, getFragments } from './api';

async function init() {
  // Get our UI elements
  const userSection = document.querySelector('#user');
  const loginBtn = document.querySelector('#login');

  // Wire up event handlers to deal with login and logout.
  loginBtn.onclick = () => {
    // Sign-in via the Amazon Cognito Hosted UI (requires redirects), see:
    signIn();
  };

  // See if we're signed in (i.e., we'll have a `user` object)
  const user = await getUser();
  if (!user) {
    return;
  }
  // Persist minimal user info for API auth headers
  localStorage.setItem(
    'user',
    JSON.stringify({ idToken: user.idToken, username: user.username, email: user.email })
  );

  // Optionally fetch fragments (not used yet, but validates auth works)
  try {
    await getFragments(false);
  } catch (e) {
    console.warn('Unable to fetch fragments:', e);
  }

  // Update the UI to welcome the user
  userSection.hidden = false;

  // Show the user's username
  userSection.querySelector('.username').innerText = user.username;
  
  // Disable the Login button
  loginBtn.disabled = true;

  // Hook up form submission
  const input = document.querySelector('#fragment-input');
  const submitBtn = document.querySelector('#submit-fragment');
  const responseEl = document.querySelector('#response');

  if (submitBtn && input && responseEl) {
    submitBtn.onclick = async () => {
      const text = input.value.trim();
      if (!text) {
        responseEl.textContent = 'Please enter some text';
        return;
      }
      submitBtn.disabled = true;
      responseEl.textContent = 'Submitting...';
      try {
        const result = await createFragment(text, 'text/plain');
        responseEl.textContent = JSON.stringify(result, null, 2);
      } catch (err) {
        responseEl.textContent = `Error: ${err.message || 'Unknown error'}`;
      } finally {
        submitBtn.disabled = false;
      }
    };
  }
}

// Wait for the DOM to be ready, then start the app
addEventListener('DOMContentLoaded', init);
// src/app.js

import { signIn, getUser } from './auth';
import { createFragment, getFragments } from './api';

async function init() {
  const userSection = document.querySelector('#user');
  const loginBtn = document.querySelector('#login');

  loginBtn.onclick = () => {
    signIn();
  };

  const user = await getUser();
  if (!user) {
    return;
  }
  localStorage.setItem(
    'user',
    JSON.stringify({ idToken: user.idToken, username: user.username, email: user.email })
  );

  try {
    await getFragments(false);
  } catch (e) {
    console.warn('Unable to fetch fragments:', e);
  }

  userSection.hidden = false;

  userSection.querySelector('.username').innerText = user.username;
  
  loginBtn.disabled = true;

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

addEventListener('DOMContentLoaded', init);
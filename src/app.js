// src/app.js

import { signIn, getUser, signOut } from './auth';
import { 
  createFragment, 
  getFragments, 
  getFragment, 
  getFragmentData, 
  deleteFragment,
  getFragmentMetadata
} from './api';

// DOM Elements
const loginBtn = document.getElementById('login');
const logoutBtn = document.getElementById('logout');
const userSection = document.getElementById('user-section');
const loginPrompt = document.getElementById('login-prompt');
const userEmail = document.getElementById('user-email');
const fragmentForm = document.getElementById('fragment-form');
const fragmentInput = document.getElementById('fragment-input');
const fragmentType = document.getElementById('fragment-type');
const submitBtn = document.getElementById('submit-fragment');
const submitText = document.getElementById('submit-text');
const submitSpinner = document.getElementById('submit-spinner');
const fragmentsList = document.getElementById('fragments-list');
const emptyState = document.getElementById('empty-state');
const loadingIndicator = document.getElementById('loading-indicator');
const refreshBtn = document.getElementById('refresh-fragments');
const alertBox = document.getElementById('alert');

// Modal elements
const modal = document.getElementById('fragment-modal');
const modalTitle = document.getElementById('modal-title');
const modalContent = document.getElementById('modal-content');
const closeModalBtn = document.getElementById('close-modal');
const deleteFragmentBtn = document.getElementById('delete-fragment');
const downloadFragmentBtn = document.getElementById('download-fragment');

// Current selected fragment ID
let currentFragmentId = null;

// Event Listeners
if (loginBtn) loginBtn.addEventListener('click', handleLogin);
if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
if (fragmentForm) fragmentForm.addEventListener('submit', handleSubmitFragment);
if (refreshBtn) refreshBtn.addEventListener('click', loadFragments);
if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
if (deleteFragmentBtn) deleteFragmentBtn.addEventListener('click', handleDeleteFragment);
if (downloadFragmentBtn) downloadFragmentBtn.addEventListener('click', handleDownloadFragment);

// Initialize the application
init();

async function init() {
  try {
    const user = await getUser();
    
    if (user) {
      // User is logged in
      userSection.classList.remove('hidden');
      loginPrompt.classList.add('hidden');
      loginBtn.classList.add('hidden');
      logoutBtn.classList.remove('hidden');
      userEmail.textContent = user.email;
      userEmail.classList.remove('hidden');
      
      // Load user's fragments
      await loadFragments();
    } else {
      // User is not logged in
      userSection.classList.add('hidden');
      loginPrompt.classList.remove('hidden');
      loginBtn.classList.remove('hidden');
      logoutBtn.classList.add('hidden');
    }
  } catch (error) {
    console.error('Initialization error:', error);
    showAlert('Error initializing application', 'error');
  }
}

async function handleLogin() {
  const loginBtn = document.getElementById('login');
  try {
    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';
    console.log('Initiating login...');
    await signIn();
  } catch (error) {
    console.error('Login error:', error);
    // Show error to user
    const errorMessage = error.message || 'Failed to sign in';
    alert(`Login failed: ${errorMessage}. Check console for details.`);
    loginBtn.disabled = false;
    loginBtn.textContent = 'Login';
  }
}

async function handleLogout() {
  try {
    await signOut();
    window.location.href = '/';
  } catch (error) {
    console.error('Logout error:', error);
    showAlert('Error during logout', 'error');
  }
}

async function handleSubmitFragment(e) {
  e.preventDefault();
  
  const content = fragmentInput.value.trim();
  const type = fragmentType.value;
  
  if (!content) {
    showAlert('Please enter some content', 'error');
    return;
  }
  
  // Validate JSON if type is application/json
  if (type === 'application/json') {
    try {
      JSON.parse(content);
    } catch (e) {
      showAlert('Invalid JSON format', 'error');
      return;
    }
  }
  
  setLoading(true);
  
  try {
    const fragment = await createFragment(content, type);
    showAlert('Fragment created successfully!', 'success');
    fragmentInput.value = ''; // Clear the input
    await loadFragments(); // Refresh the fragments list
  } catch (error) {
    console.error('Error creating fragment:', error);
    showAlert(`Error creating fragment: ${error.message}`, 'error');
  } finally {
    setLoading(false);
  }
}

async function loadFragments() {
  try {
    showLoading(true);
    
    console.log('Fetching fragments...');
    const fragments = await getFragments(true);
    console.log('Fragments metadata received:', fragments);
    
    // Ensure we have a valid array
    const fragmentsArray = Array.isArray(fragments) ? fragments : [];
    
    // Fetch content for each fragment
    const fragmentsWithContent = await Promise.all(fragmentsArray.map(async fragment => {
      try {
        const fragmentData = await getFragmentData(fragment.id);
        console.log(`Fetched content for fragment ${fragment.id}:`, fragmentData);
        return { ...fragment, content: fragmentData };
      } catch (error) {
        console.error(`Error fetching content for fragment ${fragment.id}:`, error);
        return { ...fragment, content: null };
      }
    }));
    
    console.log('All fragments with content:', fragmentsWithContent);
    renderFragments(fragmentsWithContent);
  } catch (error) {
    console.error('Error loading fragments:', error);
    showAlert('Error loading fragments', 'error');
  } finally {
    showLoading(false);
  }
}

function renderFragments(fragments) {
  console.log('Rendering fragments:', fragments);
  
  if (!fragments || fragments.length === 0) {
    console.log('No fragments to display, showing empty state');
    fragmentsList.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  
  emptyState.classList.add('hidden');
  
  // Sort fragments by creation date (newest first)
  const sortedFragments = [...fragments].sort((a, b) => 
    new Date(b.created) - new Date(a.created)
  );
  
  const fragmentCards = sortedFragments.map(fragment => createFragmentCard(fragment));
  fragmentsList.innerHTML = fragmentCards.join('');
  
  // No action buttons needed
}

function createFragmentCard(fragment) {
  const createdAt = new Date(fragment.created).toLocaleString();
  const sizeKB = Math.round((fragment.size || 0) / 1024 * 100) / 100; // Convert to KB
  
  // Create a preview of the content
  let preview = 'No content available';
  
  if (fragment.content) {
    let contentStr = '';
    
    // Convert content to string based on type
    if (fragment.type === 'application/json') {
      try {
        contentStr = typeof fragment.content === 'string' 
          ? fragment.content 
          : JSON.stringify(fragment.content);
      } catch (e) {
        contentStr = '[Invalid JSON]';
      }
    } else if (fragment.type && fragment.type.startsWith('text/')) {
      contentStr = String(fragment.content);
    }
    
    // Add content preview (first 100 chars)
    const maxLength = 100;
    if (contentStr.length > maxLength) {
      preview = contentStr.substring(0, maxLength) + '...';
    } else {
      preview = contentStr;
    }
  } else {
    preview = `[Unknown Type] ${fragment.id.substring(0, 8)}...`;
  }
  
  return `
    <div class="fragment-card">
      <div class="fragment-meta">
        <div><strong>Type:</strong> ${fragment.type}</div>
        <div><strong>Created:</strong> ${createdAt}</div>
        <div><strong>Size:</strong> ${sizeKB} KB</div>
      </div>
      <div class="fragment-content">${escapeHtml(preview)}</div>
    </div>
  `;
}

async function viewFragment(id) {
  try {
    showLoading(true);
    currentFragmentId = id;
    
    // Get fragment metadata
    const metadata = await getFragmentMetadata(id);
    
    // Get fragment data
    const response = await getFragmentData(id);
    let content = response;
    
    // Format content based on type
    if (metadata.type === 'application/json') {
      content = JSON.stringify(JSON.parse(content), null, 2);
    }
    
    // Display in modal
    modalTitle.textContent = `Fragment: ${id.substring(0, 8)}...`;
    modalContent.textContent = content;
    
    // Show the modal
    modal.classList.remove('hidden');
    
  } catch (error) {
    console.error('Error viewing fragment:', error);
    showAlert(`Error viewing fragment: ${error.message}`, 'error');
  } finally {
    showLoading(false);
  }
}

async function handleDeleteFragment(id) {
  if (!id) {
    console.error('No fragment ID provided for deletion');
    return;
  }

  try {
    showLoading(true);
    console.log('Initiating delete for fragment:', id);
    
    // Call the API to delete the fragment
    const success = await deleteFragment(id);
    
    if (success) {
      console.log('Fragment deleted, updating UI...');
      // Remove the fragment card from the UI
      const fragmentCard = document.querySelector(`.fragment-card[data-id="${id}"]`);
      if (fragmentCard) {
        fragmentCard.remove();
        console.log('Fragment card removed from UI');
        
        // Show empty state if no fragments left
        const remainingFragments = document.querySelectorAll('.fragment-card');
        if (remainingFragments.length === 0) {
          console.log('No fragments left, showing empty state');
          emptyState.classList.remove('hidden');
        }
      } else {
        console.warn('Fragment card not found in DOM, forcing reload');
        await loadFragments();
      }
      
      showAlert('Fragment deleted successfully', 'success');
    } else {
      throw new Error('Delete operation did not complete successfully');
    }
    
  } catch (error) {
    console.error('Error in handleDeleteFragment:', error);
    showAlert(`Failed to delete fragment: ${error.message}`, 'error');
    
    // Force reload fragments to ensure UI is in sync with server
    try {
      console.log('Attempting to reload fragments after error...');
      await loadFragments();
    } catch (reloadError) {
      console.error('Failed to reload fragments after delete error:', reloadError);
    }
  } finally {
    showLoading(false);
  }
}

function closeModal() {
  modal.classList.add('hidden');
  currentFragmentId = null;
}

async function handleDownloadFragment(id, type) {
  if (!id) return;
  
  try {
    const metadata = await getFragmentMetadata(id);
    const response = await getFragmentData(id);
    
    // Determine file extension based on type
    let extension = '.txt';
    if (metadata.type.includes('/')) {
      const type = metadata.type.split('/')[1];
      extension = type === 'plain' ? '.txt' : `.${type}`;
    }
    
    // Create a download link
    const blob = new Blob([response], { type: metadata.type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fragment-${currentFragmentId.substring(0, 8)}${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Error downloading fragment:', error);
    showAlert(`Error downloading fragment: ${error.message}`, 'error');
  }
}

// Helper functions
function setLoading(isLoading) {
  if (isLoading) {
    submitText.textContent = 'Creating...';
    submitSpinner.classList.remove('hidden');
    submitBtn.disabled = true;
  } else {
    submitText.textContent = 'Create Fragment';
    submitSpinner.classList.add('hidden');
    submitBtn.disabled = false;
  }
}

function showLoading(show) {
  if (show) {
    loadingIndicator.classList.add('visible');
  } else {
    loadingIndicator.classList.remove('visible');
  }
}

function showAlert(message, type = 'info') {
  alertBox.textContent = message;
  alertBox.className = `alert alert-${type}`;
  alertBox.classList.remove('hidden');
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    alertBox.classList.add('hidden');
  }, 5000);
}

function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Make functions available globally for inline event handlers
window.downloadFragment = async (id, type) => {
  currentFragmentId = id;
  await handleDownloadFragment();
};

// Close modal when clicking outside content
modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    closeModal();
  }
});
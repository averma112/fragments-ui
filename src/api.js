// src/api.js

// fragments microservice API URL - points to the local backend server
const apiUrl = 'http://ec2-3-84-128-162.compute-1.amazonaws.com:8080';
gi
/**
 * Get the current user's authentication headers (Authorization only)
 * Content-Type should be set by each API call as needed.
 */
function getAuthHeaders() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user && user.idToken) {
    return {
      Authorization: `Bearer ${user.idToken}`,
    };
  }
  return {};
}

/**
 * Handle API response and parse JSON if possible
 */
async function handleResponse(response) {
  // For 401 Unauthorized, redirect to login
  if (response.status === 401) {
    window.location.href = '/';
    return null;
  }

  if (!response.ok) {
    const error = new Error(response.statusText);
    error.status = response.status;
    try {
      const data = await response.json();
      error.message = data.error?.message || response.statusText;
    } catch (e) {
      // If we can't parse the error as JSON, use the status text
      error.message = response.statusText;
    }
    throw error;
  }
  
  // For 204 No Content responses, return null
  if (response.status === 204) {
    return null;
  }
  
  try {
    return await response.json();
  } catch (error) {
    // If response is not JSON, return as text
    return response.text();
  }
}

/**
 * Get all fragments for the current user
 */
export async function getFragments(expand = false) {
  const url = new URL('/v1/fragments', apiUrl);
  if (expand) {
    url.searchParams.append('expand', '1');
  }
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });
  
  return handleResponse(response);
}

/**
 * Get a single fragment by ID
 */
export async function getFragment(id) {
  const response = await fetch(`${apiUrl}/v1/fragments/${id}`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });
  
  return handleResponse(response);
}

/**
 * Create a new fragment
 */
export async function createFragment(content, type = 'text/plain') {
  const response = await fetch(`${apiUrl}/v1/fragments`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': type,
    },
    body: content,
  });
  
  return handleResponse(response);
}

/**
 * Update an existing fragment
 */
export async function updateFragment(id, content, type = 'text/plain') {
  const response = await fetch(`${apiUrl}/v1/fragments/${id}`, {
    method: 'PUT',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': type,
    },
    body: content,
  });
  
  return handleResponse(response);
}

/**
 * Delete a fragment
 */
export async function deleteFragment(id) {
  const response = await fetch(`${apiUrl}/v1/fragments/${id}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders(),
    },
  });
  
  return handleResponse(response);
}

/**
 * Get a fragment's data
 */
export async function getFragmentData(id) {
  const response = await fetch(`${apiUrl}/v1/fragments/${id}`, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  
  return response.text();
}

/**
 * Get fragment metadata
 */
export async function getFragmentMetadata(id) {
  const response = await fetch(`${apiUrl}/v1/fragments/${id}/info`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });
  
  return handleResponse(response);
}

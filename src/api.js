// src/api.js
// src/api.js
import { getIdToken } from './auth';
import { config } from './config';

const API_URL = config.API_URL;

// Log the configuration
console.log('API Configuration:', {
  API_URL,
  NODE_ENV: process.env.NODE_ENV
});



/**
 * Get the current user's authentication headers
 */
async function getAuthHeaders(contentType = 'application/json') {
  const token = await getIdToken();
  if (!token) {
    throw new Error('No authentication token available');
  }
  
  return {
    'Content-Type': contentType,
    'Authorization': `Bearer ${token}`
  };
}

/**
 * Handle API response and parse JSON if possible
 */
async function handleResponse(response) {
  console.log(`API Response: ${response.status} ${response.statusText}`, {
    url: response.url,
    status: response.status,
    headers: Object.fromEntries(response.headers.entries())
  });

  // For 401 Unauthorized, redirect to login
  if (response.status === 401) {
    console.warn('Authentication required, redirecting to login...');
    window.location.href = '/';
    return null;
  }

  // For 204 No Content responses, return null
  if (response.status === 204) {
    return null;
  }

  let data;
  const contentType = response.headers.get('content-type');
  
  try {
    const text = await response.text();
    data = text ? (contentType?.includes('application/json') ? JSON.parse(text) : { content: text }) : {};
  } catch (e) {
    console.error('Error parsing response:', e);
    throw new Error(`Failed to parse response: ${e.message}`);
  }

  if (!response.ok) {
    const errorMessage = data.message || data.error || response.statusText;
    const error = new Error(`API Error: ${errorMessage} (${response.status})`);
    error.status = response.status;
    error.data = data;
    error.url = response.url;
    console.error('API Error:', error);
    throw error;
  }

  return data;
}

/**
 * Get all fragments for the current user
 * @param {boolean} expand - Whether to expand the fragments with full metadata
 * @returns {Promise<Array>} Array of fragments or fragment metadata
 */
export async function getFragments(expand = false) {
  console.log('API_URL from config:', API_URL);
  
  // Try different endpoint variations
  const endpoints = [
    `${API_URL}/v1/fragments`,
    `${API_URL}/fragments`,
    `${API_URL}/api/fragments`
  ];

  let lastError;
  
  for (const endpoint of endpoints) {
    try {
      const url = new URL(endpoint);
      
      if (expand) {
        url.searchParams.append('expand', '1');
      }

      console.log(`[getFragments] Trying endpoint: ${url.toString()}`);
      console.log(`[getFragments] Request headers:`, await getAuthHeaders());
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: await getAuthHeaders(),
        credentials: 'include' // Include cookies in the request
      });

      console.log(`[getFragments] Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        console.error(`[getFragments] Request failed with status ${response.status}:`, response.statusText);
        const errorText = await response.text();
        console.error('[getFragments] Error response body:', errorText);
        throw new Error(`Request failed with status ${response.status}: ${response.statusText}`);
      }

      const result = await handleResponse(response);
      console.log(`[getFragments] Success with endpoint: ${url.toString()}`);
      return Array.isArray(result) ? result : (result.fragments || []);
      
    } catch (error) {
      console.error(`[getFragments] Error with endpoint ${endpoint}:`, error);
      lastError = error;
      
      // If this is a network error, log it and try the next endpoint
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        console.error('[getFragments] Network error - could not connect to the server');
      }
    }
  }
  
  const errorMessage = lastError ? 
    `All fragment endpoints failed. Last error: ${lastError.message}` : 
    'All fragment endpoints failed with no specific error';
  
  console.error(errorMessage);
  throw new Error(errorMessage);
}

/**
 * Get a single fragment by ID
 */
export async function getFragment(id) {
  const response = await fetch(`${API_URL}/v1/fragments/${id}`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });
  
  return handleResponse(response);
}

/**
 * Create a new fragment
 * @param {string} content - The fragment content
 * @param {string} type - The content type (e.g., 'text/plain')
 * @returns {Promise<Object>} The created fragment
 */
export async function createFragment(content, type = 'text/plain') {
  const endpoint = `${API_URL}/v1/fragments`;
  
  console.log(`Creating fragment at: ${endpoint}`);
  console.log('Content type:', type);
  
  try {
    const headers = await getAuthHeaders(type);
    console.log('Request headers:', headers);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: headers,
      body: content,
    });
    
    console.log('Response received, status:', response.status);
    
    if (!response.ok) {
      // Try to get error details from response
      let errorDetails = '';
      try {
        const errorData = await response.json();
        errorDetails = errorData.error?.message || errorData.message || JSON.stringify(errorData);
      } catch (e) {
        errorDetails = await response.text();
      }
      
      const error = new Error(`Failed to create fragment: ${response.status} ${response.statusText} - ${errorDetails}`);
      error.status = response.status;
      error.url = endpoint;
      console.error('Fragment creation failed:', error);
      throw error;
    }
    
    const result = await handleResponse(response);
    console.log('Fragment created successfully at:', endpoint);
    return result;
    
  } catch (error) {
    console.error('Error creating fragment:', {
      message: error.message,
      status: error.status,
      url: error.url,
      data: error.data
    });
    throw error;
  }
}

/**
 * Update an existing fragment
 */
export async function updateFragment(id, content, type = 'text/plain') {
  const response = await fetch(`${API_URL}/`, {
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
  if (!id) {
    throw new Error('No fragment ID provided for deletion');
  }

  console.log(`Deleting fragment with ID: ${id}`);
  
  try {
    const response = await fetch(`${API_URL}/v1/fragments/${id}`, {
      method: 'DELETE',
      headers: await getAuthHeaders('*/*'),
    });
    
    console.log('Delete response status:', response.status, response.statusText);
    
    if (!response.ok) {
      // Try to get more detailed error info
      let errorDetails = '';
      try {
        const errorData = await response.json();
        errorDetails = errorData.error?.message || JSON.stringify(errorData);
      } catch (e) {
        errorDetails = await response.text();
      }
      
      const error = new Error(
        `Failed to delete fragment: ${response.status} ${response.statusText} - ${errorDetails}`
      );
      error.status = response.status;
      throw error;
    }
    
    console.log('Fragment deleted successfully');
    return true;
    
  } catch (error) {
    console.error('Error in deleteFragment:', error);
    // Re-throw with more context
    throw new Error(`Failed to delete fragment: ${error.message}`);
  }
}

/**
 * Get a fragment's data
 */
export async function getFragmentData(id) {
  try {
    const response = await fetch(`${API_URL}/v1/fragments/${id}`, {
      headers: await getAuthHeaders('*/*'),
    });
    
    if (!response.ok) {
      const error = new Error(`Failed to fetch fragment data: ${response.status} ${response.statusText}`);
      error.status = response.status;
      throw error;
    }
    
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  } catch (error) {
    console.error(`Error fetching fragment data for ID ${id}:`, error);
    throw error;
  }
}

/**
 * Get fragment metadata
 */
export async function getFragmentMetadata(id) {
  const response = await fetch(`${API_URL}/v1/fragments/${id}/info`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });
  
  return handleResponse(response);
}

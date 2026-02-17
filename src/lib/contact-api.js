const CONTACT_API_URL = 'https://chat.cognavia.ai/api/v1/contact';

export async function submitContactForm(data) {
  const response = await fetch(CONTACT_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.detail || result.error || 'Failed to send message. Please try again.');
  }

  return result;
}

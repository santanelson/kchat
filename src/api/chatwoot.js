import axios from 'axios';

const createClient = (baseUrl, token) => {
  // Ensure baseUrl doesn't have trailing slash
  const cleanUrl = baseUrl.replace(/\/$/, '');
  return axios.create({
    baseURL: cleanUrl,
    headers: {
      'api_access_token': token,
      'Content-Type': 'application/json',
    },
  });
};

export const fetchConversations = async (baseUrl, token, accountId) => {
  if (!baseUrl || !token || !accountId) return { payload: [] };
  
  const client = createClient(baseUrl, token);
  try {
    // Fetching open conversations. You might want to fetch all or configurable status.
    // Chatwoot pagination is default 25. Might need to loop for all, but starting simple.
    const response = await client.get(`/api/v1/accounts/${accountId}/conversations?status=open`);
    return response.data; // { meta: ..., payload: [...] }
  } catch (error) {
    console.error("Error fetching conversations:", error);
    throw error;
  }
};

export const updateConversationLabels = async (baseUrl, token, accountId, conversationId, labels) => {
  const client = createClient(baseUrl, token);
  try {
    const response = await client.post(`/api/v1/accounts/${accountId}/conversations/${conversationId}/labels`, {
      labels: labels
    });
    return response.data;
  } catch (error) {
    console.error("Error updating labels:", error);
    throw error;
  }
};

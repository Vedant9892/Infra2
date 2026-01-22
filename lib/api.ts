const API_BASE_URL = 'http://localhost:5000';

export const api = {
  attendance: {
    mark: async (data: { location: string; photoUrl: string }) => {
      const response = await fetch(`${API_BASE_URL}/api/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
  },
  tasks: {
    list: async () => {
      const response = await fetch(`${API_BASE_URL}/api/tasks`);
      return response.json();
    },
    update: async (id: number, status: string) => {
      const response = await fetch(`${API_BASE_URL}/api/tasks/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      return response.json();
    },
  },
  user: {
    profile: async () => {
      const response = await fetch(`${API_BASE_URL}/api/users/me`);
      return response.json();
    },
  },
};

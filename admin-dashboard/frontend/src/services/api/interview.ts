const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function getInterviews(page = 1) {
  try {
    const res = await fetch(`${API_BASE_URL}/interviews?page=${page}`, {
      cache: 'no-store', // Ensure fresh data on every request
    });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch interviews: ${res.status}`);
    }
    
    return res.json();
  } catch (error) {
    console.error("API ERROR: getInterviews failed:", error);
    return { interviews: [], total: 0, hasMore: false };
  }
}

export async function getInterviewById(id: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/interviews/${id}`, {
      cache: 'no-store',
    });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch interview ${id}: ${res.status}`);
    }
    
    return res.json();
  } catch (error) {
    console.error(`API ERROR: getInterviewById(${id}) failed:`, error);
    return null;
  }
}

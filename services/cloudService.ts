
/**
 * tRonsfer Cloud Service
 * Connects to Supabase for real user management.
 * 
 * INSTRUCTIONS FOR REAL BACKEND:
 * 1. Go to https://supabase.com and create a free project.
 * 2. Create a table named 'users'.
 * 3. Add columns: 
 *    - 'username' (text, Primary Key)
 *    - 'password' (text)  <-- NEW!
 *    - 'created_at' (timestamptz, default: now())
 * 4. Go to Project Settings -> API.
 * 5. Copy "Project URL" and "anon public" key and paste them below.
 */

const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_KEY';

export class CloudService {
  
  static async registerUser(username: string, password: string): Promise<{success: boolean, error?: string}> {
    if (SUPABASE_URL.includes('YOUR_')) {
      console.warn("Supabase not configured. Simulating success.");
      return { success: true }; 
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ 
          username: username,
          password: password, // In a real prod app, hash this client-side or use Supabase Auth!
        })
      });

      if (!response.ok) {
        return { success: false, error: "Username already taken" };
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: "Network error" };
    }
  }

  static async loginUser(username: string, password: string): Promise<{success: boolean, error?: string}> {
    if (SUPABASE_URL.includes('YOUR_')) {
        // Simulation login
        return { success: true };
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/users?username=eq.${username}&select=password`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      const data = await response.json();
      
      if (data.length === 0) return { success: false, error: "User not found" };
      
      const user = data[0];
      if (user.password === password) {
          return { success: true };
      } else {
          return { success: false, error: "Incorrect password" };
      }
    } catch (e) {
      return { success: false, error: "Login failed" };
    }
  }
}

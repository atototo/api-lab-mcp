/**
 * SessionManager Service
 * Manages session-based authentication including cookies and custom headers
 */

export interface Cookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: Date;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

export interface SessionData {
  cookies: Cookie[];
  headers: Record<string, string>;
  createdAt: Date;
  lastUsed: Date;
}

export class SessionManager {
  private sessions: Map<string, SessionData> = new Map();
  private currentSessionId: string | null = null;

  /**
   * Parse cookie string into Cookie objects
   * @param cookieString - Raw cookie string like "JSESSIONID=ABC123; XSRF-TOKEN=xyz"
   * @returns Array of parsed cookies
   */
  parseCookies(cookieString: string): Cookie[] {
    const cookies: Cookie[] = [];
    
    // Split by semicolon and process each cookie
    const cookiePairs = cookieString.split(';').map(c => c.trim());
    
    for (const cookiePair of cookiePairs) {
      if (!cookiePair) continue;
      
      // Each cookiePair is now just "name=value" since we already split by semicolon
      const [name, ...valueParts] = cookiePair.split('=');
      const value = valueParts.join('='); // Handle values that contain '='
      
      if (name && value) {
        const cookie: Cookie = {
          name: name.trim(),
          value: value.trim()
        };
        
        cookies.push(cookie);
      }
    }
    
    return cookies;
  }

  /**
   * Convert cookies back to string format
   * @param cookies - Array of Cookie objects
   * @returns Cookie string for HTTP headers
   */
  cookiesToString(cookies: Cookie[]): string {
    return cookies
      .map(cookie => `${cookie.name}=${cookie.value}`)
      .join('; ');
  }

  /**
   * Store a new session
   * @param sessionId - Unique session identifier
   * @param cookieString - Cookie string to parse and store
   * @param headers - Additional headers for this session
   * @returns The stored session data
   */
  storeSession(sessionId: string, cookieString: string, headers: Record<string, string> = {}): SessionData {
    const cookies = this.parseCookies(cookieString);
    const sessionData: SessionData = {
      cookies,
      headers,
      createdAt: new Date(),
      lastUsed: new Date()
    };
    
    this.sessions.set(sessionId, sessionData);
    this.currentSessionId = sessionId;
    
    return sessionData;
  }

  /**
   * Get a stored session
   * @param sessionId - Session identifier (uses current if not provided)
   * @returns Session data or null if not found
   */
  getSession(sessionId?: string): SessionData | null {
    const id = sessionId || this.currentSessionId;
    if (!id) return null;
    
    const session = this.sessions.get(id);
    if (session) {
      session.lastUsed = new Date();
    }
    
    return session || null;
  }

  /**
   * Get the current active session
   * @returns Current session data or null
   */
  getCurrentSession(): SessionData | null {
    if (!this.currentSessionId) return null;
    return this.getSession(this.currentSessionId);
  }

  /**
   * Set the current active session
   * @param sessionId - Session identifier to make current
   */
  setCurrentSession(sessionId: string): void {
    if (this.sessions.has(sessionId)) {
      this.currentSessionId = sessionId;
    } else {
      throw new Error(`Session ${sessionId} not found`);
    }
  }

  /**
   * Clear a specific session or all sessions
   * @param sessionId - Optional session to clear (clears all if not provided)
   */
  clearSession(sessionId?: string): void {
    if (sessionId) {
      this.sessions.delete(sessionId);
      if (this.currentSessionId === sessionId) {
        this.currentSessionId = null;
      }
    } else {
      this.sessions.clear();
      this.currentSessionId = null;
    }
  }

  /**
   * Check if a session has expired based on cookie expiration
   * @param sessionId - Session to check
   * @returns True if expired, false otherwise
   */
  isSessionExpired(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return true;
    
    const now = new Date();
    
    // Check if any cookie has expired
    for (const cookie of session.cookies) {
      if (cookie.expires && cookie.expires < now) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Get all headers for a session (including Cookie header)
   * @param sessionId - Session identifier (uses current if not provided)
   * @returns Headers object ready for HTTP requests
   */
  getSessionHeaders(sessionId?: string): Record<string, string> {
    const session = this.getSession(sessionId);
    if (!session) return {};
    
    const headers: Record<string, string> = {
      ...session.headers
    };
    
    // Add Cookie header if cookies exist
    if (session.cookies.length > 0) {
      headers['Cookie'] = this.cookiesToString(session.cookies);
    }
    
    return headers;
  }

  /**
   * Update session headers
   * @param sessionId - Session identifier
   * @param headers - Headers to add or update
   */
  updateSessionHeaders(sessionId: string, headers: Record<string, string>): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    Object.assign(session.headers, headers);
    session.lastUsed = new Date();
  }

  /**
   * List all stored sessions
   * @returns Array of session IDs
   */
  listSessions(): string[] {
    return Array.from(this.sessions.keys());
  }

  /**
   * Get session statistics
   * @returns Session count and current session info
   */
  getStats(): { total: number; current: string | null; expired: number } {
    let expired = 0;
    
    for (const [id] of this.sessions) {
      if (this.isSessionExpired(id)) {
        expired++;
      }
    }
    
    return {
      total: this.sessions.size,
      current: this.currentSessionId,
      expired
    };
  }

  /**
   * Clone the session manager with all sessions
   * @returns New SessionManager instance with same data
   */
  clone(): SessionManager {
    const newManager = new SessionManager();
    
    // Copy all sessions
    this.sessions.forEach((sessionData, sessionId) => {
      newManager.sessions.set(sessionId, {
        cookies: [...sessionData.cookies],
        headers: { ...sessionData.headers },
        createdAt: new Date(sessionData.createdAt),
        lastUsed: new Date(sessionData.lastUsed)
      });
    });
    
    newManager.currentSessionId = this.currentSessionId;
    
    return newManager;
  }
}
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export class APIClient {
  private static token: string | null = null;

  static setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  static getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  private static async request<T>(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options: RequestInit = {
      method,
      headers,
      credentials: 'include',
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || `Request failed with status ${response.status}`);
    }

    return responseData;
  }

  // Auth endpoints
  static async signUp(email: string, password: string, fullName: string) {
    const response = await this.request('POST', '/auth/signup', {
      email,
      password,
      fullName,
    });
    this.setToken(response.token);
    return response;
  }

  static async signIn(email: string, password: string) {
    const response = await this.request('POST', '/auth/signin', {
      email,
      password,
    });
    this.setToken(response.token);
    return response;
  }

  static async getCurrentUser() {
    return this.request('GET', '/auth/me');
  }

  static signOut() {
    this.setToken(null);
  }

  // Courses endpoints
  static async getCourses(page = 1, limit = 10) {
    return this.request('GET', `/courses?page=${page}&limit=${limit}`);
  }

  static async getCourse(id: string) {
    return this.request('GET', `/courses/${id}`);
  }

  static async createCourse(data: any) {
    return this.request('POST', '/courses', data);
  }

  static async updateCourse(id: string, data: any) {
    return this.request('PUT', `/courses/${id}`, data);
  }

  static async deleteCourse(id: string) {
    return this.request('DELETE', `/courses/${id}`);
  }

  static async getCourseMembers(courseId: string) {
    return this.request('GET', `/courses/${courseId}/members`);
  }

  static async addCourseMember(courseId: string, userId: string, memberRole: string) {
    return this.request('POST', `/courses/${courseId}/members`, {
      userId,
      memberRole,
    });
  }

  // Assignments endpoints
  static async getAssignments(courseId?: string, status?: string) {
    let endpoint = '/assignments';
    const params = new URLSearchParams();
    if (courseId) params.append('courseId', courseId);
    if (status) params.append('status', status);
    if (params.toString()) endpoint += `?${params.toString()}`;
    return this.request('GET', endpoint);
  }

  static async getAssignment(id: string) {
    return this.request('GET', `/assignments/${id}`);
  }

  static async createAssignment(data: any) {
    return this.request('POST', '/assignments', data);
  }

  static async updateAssignment(id: string, data: any) {
    return this.request('PUT', `/assignments/${id}`, data);
  }

  static async deleteAssignment(id: string) {
    return this.request('DELETE', `/assignments/${id}`);
  }

  // Submissions endpoints
  static async getSubmissions(assignmentId?: string, studentId?: string) {
    let endpoint = '/submissions';
    const params = new URLSearchParams();
    if (assignmentId) params.append('assignmentId', assignmentId);
    if (studentId) params.append('studentId', studentId);
    if (params.toString()) endpoint += `?${params.toString()}`;
    return this.request('GET', endpoint);
  }

  static async getSubmission(id: string) {
    return this.request('GET', `/submissions/${id}`);
  }

  static async submitAssignment(assignmentId: string, answer: string) {
    return this.request('POST', '/submissions', {
      assignmentId,
      answer,
    });
  }

  static async updateSubmission(id: string, answer: string) {
    return this.request('PUT', `/submissions/${id}`, {
      answer,
    });
  }

  static async gradeSubmission(id: string, marks: number, feedback?: string) {
    return this.request('PUT', `/submissions/${id}/grade`, {
      marks,
      feedback,
    });
  }

  // Users endpoints
  static async getUsers(role?: string) {
    let endpoint = '/users';
    if (role) endpoint += `?role=${role}`;
    return this.request('GET', endpoint);
  }

  static async getUser(id: string) {
    return this.request('GET', `/users/${id}`);
  }

  static async updateUserProfile(id: string, data: any) {
    return this.request('PUT', `/users/${id}`, data);
  }

  static async updateUserRole(id: string, role: string) {
    return this.request('PUT', `/users/${id}/role`, { role });
  }

  static async deleteUser(id: string) {
    return this.request('DELETE', `/users/${id}`);
  }
}

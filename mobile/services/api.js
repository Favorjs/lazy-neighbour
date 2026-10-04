import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/config';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

class ApiService {
    constructor() {
        this.token = null;
    }

    // Initialize - load stored token
    async init() {
        try {
            this.token = await AsyncStorage.getItem(TOKEN_KEY);
        } catch (error) {
            console.error('Failed to load token:', error);
        }
    }

    // Set auth token
    async setToken(token) {
        this.token = token;
        await AsyncStorage.setItem(TOKEN_KEY, token);
    }

    // Clear auth
    async clearAuth() {
        this.token = null;
        await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    }

    // Get stored user
    async getStoredUser() {
        try {
            const userData = await AsyncStorage.getItem(USER_KEY);
            return userData ? JSON.parse(userData) : null;
        } catch {
            return null;
        }
    }

    // Store user
    async storeUser(user) {
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    }

    // HTTP request helper
    async request(endpoint, options = {}) {
        const url = `${API_URL}/api${endpoint}`;

        const headers = {
            'Content-Type': 'application/json',
            ...(this.token && { Authorization: `Bearer ${this.token}` }),
            ...options.headers,
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers,
                body: options.body ? JSON.stringify(options.body) : undefined,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    }

    // ============ AUTH ============

    async register(email, password, name, phone) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: { email, password, name, phone },
        });
        await this.setToken(data.token);
        await this.storeUser(data.user);
        return data;
    }

    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: { email, password },
        });
        await this.setToken(data.token);
        await this.storeUser(data.user);
        return data;
    }

    async getMe() {
        return this.request('/auth/me');
    }

    async toggleRole() {
        return this.request('/auth/toggle-role', { method: 'PATCH' });
    }

    async updateProfile(data) {
        return this.request('/auth/profile', {
            method: 'PATCH',
            body: data,
        });
    }

    // ============ ERRANDS ============

    async createErrand(errandData) {
        return this.request('/errands', {
            method: 'POST',
            body: errandData,
        });
    }

    async getNearbyErrands(lat, lng, radiusKm = 5, category) {
        let query = `?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}`;
        if (category) query += `&category=${category}`;
        return this.request(`/errands/nearby${query}`);
    }

    async getFeed(page = 1, category) {
        let query = `?page=${page}`;
        if (category) query += `&category=${category}`;
        return this.request(`/errands/feed${query}`);
    }

    async getMyErrands(role, status) {
        let query = '?';
        if (role) query += `role=${role}&`;
        if (status) query += `status=${status}`;
        return this.request(`/errands/my${query}`);
    }

    async getErrand(id) {
        return this.request(`/errands/${id}`);
    }

    async acceptErrand(id) {
        return this.request(`/errands/${id}/accept`, { method: 'POST' });
    }

    async completeErrand(id, proofPhotoUrl) {
        return this.request(`/errands/${id}/complete`, {
            method: 'POST',
            body: { proofPhotoUrl },
        });
    }

    async releasePayment(id) {
        return this.request(`/errands/${id}/release`, { method: 'POST' });
    }

    async cancelErrand(id) {
        return this.request(`/errands/${id}/cancel`, { method: 'POST' });
    }

    async disputeErrand(id, reason) {
        return this.request(`/errands/${id}/dispute`, {
            method: 'POST',
            body: { reason },
        });
    }

    // ============ CHAT ============

    async getMessages(errandId) {
        return this.request(`/chat/${errandId}`);
    }

    async sendMessage(errandId, content) {
        return this.request(`/chat/${errandId}`, {
            method: 'POST',
            body: { content },
        });
    }

    // ============ PAYMENTS ============

    async createPaymentIntent(errandId) {
        return this.request('/payments/create-payment-intent', {
            method: 'POST',
            body: { errandId },
        });
    }

    async connectStripeAccount() {
        return this.request('/payments/connect-account', { method: 'POST' });
    }

    async getBalance() {
        return this.request('/payments/balance');
    }
}

export const api = new ApiService();
export default api;

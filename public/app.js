const { createApp } = Vue;

const API = {
  login: '/api/v1/auth/login',
  logout: '/api/v1/auth/logout',
  refresh: '/api/v1/auth/refresh-tokens',
  profile: '/api/v1/auth/profile',
  adminUsers: '/api/v1/admin-role/users',
  adminSymbols: '/api/v1/admin-role/symbols',
  clientSymbols: '/api/v1/client-role/symbols',
};

createApp({
  data() {
    return {
      user: null,
      loadingProfile: false,
      busy: {
        auth: false,
        symbols: false,
        users: false,
        clientSymbols: false,
      },
      loginForm: {
        email: '',
        password: '',
      },
      symbolForm: {
        id: '',
        name: '',
        providerSymbol: '',
        price: '',
        isPublic: false,
      },
      clientForm: {
        id: '',
        email: '',
        name: '',
        password: '',
        role: 'CLIENT',
      },
      adminSymbols: {
        items: [],
        count: 0,
        page: 1,
        take: 10,
      },
      adminUsers: {
        items: [],
        count: 0,
        page: 1,
        take: 10,
      },
      clientSymbols: {
        items: [],
        count: 0,
        page: 1,
        take: 10,
      },
      subscribedSymbols: [],
      subscriptionMap: {},
      socket: null,
      socketStatus: {
        label: 'Socket offline',
        badgeClass: 'text-bg-danger',
      },
      activityLog: [],
      toasts: [],
      refreshPromise: null,
    };
  },

  computed: {
    isAdmin() {
      return this.user?.role === 'ADMIN';
    },

    isClient() {
      return this.user?.role === 'CLIENT';
    },

    adminSymbolsLastPage() {
      return Math.max(1, Math.ceil(this.adminSymbols.count / this.adminSymbols.take));
    },

    adminUsersLastPage() {
      return Math.max(1, Math.ceil(this.adminUsers.count / this.adminUsers.take));
    },

    clientSymbolsLastPage() {
      return Math.max(1, Math.ceil(this.clientSymbols.count / this.clientSymbols.take));
    },

    activeSubscriptionItems() {
      return this.subscribedSymbols
        .map((providerSymbol) => this.subscriptionMap[providerSymbol])
        .filter(Boolean);
    },
  },

  mounted() {
    this.bootstrap();
  },

  methods: {
    query(params) {
      const search = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        if (Array.isArray(value)) {
          value.forEach((item) => search.append(key, item));
          return;
        }
        search.set(key, String(value));
      });
      const qs = search.toString();
      return qs ? `?${qs}` : '';
    },

    formatPrice(value) {
      if (value === null || value === undefined || value === '') return '-';
      const number = Number(value);
      if (Number.isNaN(number)) return '-';
      return number.toLocaleString(undefined, {
        maximumFractionDigits: 8,
        minimumFractionDigits: 0,
      });
    },

    setSocketStatus(label, variant) {
      const map = {
        success: 'text-bg-success',
        warning: 'text-bg-warning',
        danger: 'text-bg-danger',
        secondary: 'text-bg-secondary',
      };
      this.socketStatus = {
        label,
        badgeClass: map[variant] || map.secondary,
      };
    },

    addLog(message, variant = 'secondary') {
      const map = {
        success: 'alert-success',
        danger: 'alert-danger',
        warning: 'alert-warning',
        secondary: 'alert-secondary',
        info: 'alert-info',
      };
      this.activityLog.unshift({
        id: `${Date.now()}-${Math.random()}`,
        message,
        alertClass: map[variant] || map.secondary,
      });
      this.activityLog.splice(8);
    },

    notify(message, variant = 'secondary') {
      const map = {
        success: 'alert-success',
        danger: 'alert-danger',
        warning: 'alert-warning',
        secondary: 'alert-secondary',
        info: 'alert-primary',
      };
      const toast = {
        id: `${Date.now()}-${Math.random()}`,
        message,
        alertClass: map[variant] || map.secondary,
      };
      this.toasts.unshift(toast);
      window.setTimeout(() => {
        this.toasts = this.toasts.filter((item) => item.id !== toast.id);
      }, 3000);
    },

    setUser(user) {
      this.user = user;
    },

    clearSocketState() {
      this.subscribedSymbols = [];
      this.subscriptionMap = {};
    },

    disconnectSocket() {
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }
      this.clearSocketState();
      this.setSocketStatus('Socket offline', 'danger');
    },

    connectSocket() {
      this.disconnectSocket();
      this.setSocketStatus('Socket connecting...', 'warning');

      const socket = io({
        transports: ['websocket'],
        withCredentials: true,
      });

      this.socket = socket;

      socket.on('connect', () => {
        this.setSocketStatus('Socket connected', 'success');
        this.addLog('Socket connected', 'success');
      });

      socket.on('disconnect', (reason) => {
        this.setSocketStatus(`Socket offline (${reason})`, 'danger');
      });

      socket.on('connect_error', (error) => {
        this.setSocketStatus('Socket error', 'danger');
        this.addLog(`Socket error: ${error.message}`, 'danger');
      });

      socket.on('SYMBOL:PRICE_CHANGED', (update) => {
        this.upsertSymbolPrice(update);
        if (this.isSubscribed(update.providerSymbol)) {
          // this.notify(`${update.providerSymbol}: ${this.formatPrice(update.price)}`, 'success');
        }
      });
    },

    isSubscribed(providerSymbol) {
      return this.subscribedSymbols.includes(providerSymbol);
    },

    async api(path, options = {}) {
      const { method = 'GET', body, headers = {}, retry = true } = options;

      const response = await fetch(path, {
        method,
        credentials: 'include',
        headers: {
          ...(body !== undefined && !(body instanceof FormData)
            ? { 'Content-Type': 'application/json' }
            : {}),
          ...headers,
        },
        body:
          body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
      });

      if (response.status === 401 && retry && path !== API.refresh && path !== API.login) {
        await this.refreshTokens();
        return this.api(path, { ...options, retry: false });
      }

      if (response.status === 204) {
        return null;
      }

      const raw = await response.text();
      let data = null;
      if (raw) {
        try {
          data = JSON.parse(raw);
        } catch (_error) {
          data = raw;
        }
      }

      if (!response.ok) {
        const message =
          data?.message ||
          data?.error?.message ||
          (typeof data === 'string' ? data : null) ||
          response.statusText ||
          'Request failed';
        throw new Error(message);
      }

      return data;
    },

    async refreshTokens() {
      if (!this.refreshPromise) {
        this.refreshPromise = this.api(API.refresh, { method: 'PUT', retry: false }).finally(() => {
          this.refreshPromise = null;
        });
      }

      return this.refreshPromise;
    },

    resetSymbolForm() {
      this.symbolForm = {
        id: '',
        name: '',
        providerSymbol: '',
        price: '',
        isPublic: false,
      };
    },

    editSymbol(symbol) {
      this.symbolForm = {
        id: symbol.id,
        name: symbol.name || '',
        providerSymbol: symbol.providerSymbol || '',
        price: symbol.price ?? '',
        isPublic: Boolean(symbol.isPublic),
      };
    },

    resetClientForm() {
      this.clientForm = {
        id: '',
        email: '',
        name: '',
        password: '',
        role: 'CLIENT',
      };
    },

    editClient(client) {
      this.clientForm = {
        id: client.id,
        email: client.email || '',
        name: client.name || '',
        password: '',
        role: client.role || 'CLIENT',
      };
    },

    async loadProfile({ silent = false } = {}) {
      this.loadingProfile = true;

      try {
        const user = await this.api(API.profile);
        this.setUser(user);

        if (user.role === 'CLIENT') {
          this.connectSocket();
          await this.loadClientSymbols(1);
        } else {
          this.disconnectSocket();
          await Promise.all([this.loadAdminSymbols(1), this.loadAdminUsers(1)]);
        }

        if (!silent) {
          this.addLog(`Loaded profile for ${user.email}`, 'success');
        }

        return user;
      } finally {
        this.loadingProfile = false;
      }
    },

    async refreshProfile() {
      try {
        await this.loadProfile();
        this.notify('Profile refreshed', 'success');
      } catch (error) {
        this.addLog(`Profile refresh failed: ${error.message}`, 'danger');
        this.notify(error.message, 'danger');
        this.setUser(null);
        this.disconnectSocket();
      }
    },

    async login() {
      this.busy.auth = true;

      try {
        const response = await this.api(API.login, {
          method: 'POST',
          body: {
            email: this.loginForm.email,
            password: this.loginForm.password,
          },
        });

        this.setUser(response.user);
        this.addLog(`Logged in as ${response.user.email}`, 'success');
        this.notify(`Logged in as ${response.user.email}`, 'success');

        if (response.user.role === 'CLIENT') {
          this.connectSocket();
          await this.loadClientSymbols(1);
        } else {
          this.disconnectSocket();
          await Promise.all([this.loadAdminSymbols(1), this.loadAdminUsers(1)]);
        }
      } catch (error) {
        this.addLog(error.message, 'danger');
        this.notify(error.message, 'danger');
      } finally {
        this.busy.auth = false;
      }
    },

    async logout() {
      try {
        await this.api(API.logout, { method: 'PUT' });
      } catch (error) {
        this.addLog(`Logout warning: ${error.message}`, 'warning');
      }

      this.disconnectSocket();
      this.setUser(null);
      this.resetSymbolForm();
      this.resetClientForm();
      this.adminSymbols.items = [];
      this.adminSymbols.count = 0;
      this.adminSymbols.page = 1;
      this.adminUsers.items = [];
      this.adminUsers.count = 0;
      this.adminUsers.page = 1;
      this.clientSymbols.items = [];
      this.clientSymbols.count = 0;
      this.clientSymbols.page = 1;
      this.addLog('Session closed', 'secondary');
      this.notify('Logged out', 'secondary');
    },

    async loadAdminSymbols(page = this.adminSymbols.page) {
      this.busy.symbols = true;
      this.adminSymbols.page = page;

      try {
        const data = await this.api(
          `${API.adminSymbols}${this.query({
            page: this.adminSymbols.page,
            take: this.adminSymbols.take,
          })}`,
        );

        this.adminSymbols.items = data.result || [];
        this.adminSymbols.count = data.count || 0;
      } catch (error) {
        this.addLog(error.message, 'danger');
        this.notify(error.message, 'danger');
      } finally {
        this.busy.symbols = false;
      }
    },

    async loadAdminUsers(page = this.adminUsers.page) {
      this.busy.users = true;
      this.adminUsers.page = page;

      try {
        const data = await this.api(
          `${API.adminUsers}${this.query({
            page: this.adminUsers.page,
            take: this.adminUsers.take,
            roles: ['CLIENT'],
          })}`,
        );

        this.adminUsers.items = data.result || [];
        this.adminUsers.count = data.count || 0;
      } catch (error) {
        this.addLog(error.message, 'danger');
        this.notify(error.message, 'danger');
      } finally {
        this.busy.users = false;
      }
    },

    async loadClientSymbols(page = this.clientSymbols.page) {
      this.busy.clientSymbols = true;
      this.clientSymbols.page = page;

      try {
        const data = await this.api(
          `${API.clientSymbols}${this.query({
            page: this.clientSymbols.page,
            take: this.clientSymbols.take,
          })}`,
        );

        this.clientSymbols.items = data.result || [];
        this.clientSymbols.count = data.count || 0;
      } catch (error) {
        this.addLog(error.message, 'danger');
        this.notify(error.message, 'danger');
      } finally {
        this.busy.clientSymbols = false;
      }
    },

    upsertSymbolPrice(update) {
      const patchRows = (rows) => {
        const item = rows.find((row) => row.providerSymbol === update.providerSymbol);
        if (!item) return;
        item.price = update.price;
        item.name = update.name ?? item.name;
      };

      patchRows(this.adminSymbols.items);
      patchRows(this.clientSymbols.items);

      if (this.subscriptionMap[update.providerSymbol]) {
        this.subscriptionMap[update.providerSymbol] = {
          ...this.subscriptionMap[update.providerSymbol],
          price: update.price,
          name: update.name ?? this.subscriptionMap[update.providerSymbol].name,
        };
      }
    },

    async saveSymbol() {
      this.busy.symbols = true;

      try {
        const providerSymbol = this.symbolForm.providerSymbol.trim().toUpperCase();
        if (!providerSymbol) {
          throw new Error('providerSymbol is required');
        }

        const payload = {
          name: this.symbolForm.name.trim() || undefined,
          providerSymbol,
          isPublic: Boolean(this.symbolForm.isPublic),
        };

        const priceValue = this.symbolForm.price;
        if (priceValue !== '' && priceValue !== null && priceValue !== undefined) {
          payload.price = Number(priceValue);
        }

        const url = this.symbolForm.id
          ? `${API.adminSymbols}/${this.symbolForm.id}`
          : API.adminSymbols;
        const method = this.symbolForm.id ? 'PATCH' : 'POST';
        const saved = await this.api(url, { method, body: payload });

        this.addLog(`Symbol saved: ${saved.providerSymbol}`, 'success');
        this.notify(`Saved ${saved.providerSymbol}`, 'success');
        this.resetSymbolForm();
        await this.loadAdminSymbols(this.adminSymbols.page);
      } catch (error) {
        this.addLog(error.message, 'danger');
        this.notify(error.message, 'danger');
      } finally {
        this.busy.symbols = false;
      }
    },

    async saveClient() {
      this.busy.users = true;

      try {
        const payload = {
          email: this.clientForm.email.trim().toLowerCase(),
          name: this.clientForm.name.trim() || undefined,
          role: this.clientForm.role,
        };

        const password = this.clientForm.password.trim();
        if (!this.clientForm.id || password) {
          if (!password) {
            throw new Error('Password is required when creating a client');
          }
          payload.password = password;
        }

        const url = this.clientForm.id ? `${API.adminUsers}/${this.clientForm.id}` : API.adminUsers;
        const method = this.clientForm.id ? 'PATCH' : 'POST';
        const saved = await this.api(url, {
          method,
          body: this.clientForm.id ? payload : { ...payload, password },
        });

        this.addLog(`Client saved: ${saved.email}`, 'success');
        this.notify(`Saved ${saved.email}`, 'success');
        this.resetClientForm();
        await this.loadAdminUsers(this.adminUsers.page);
      } catch (error) {
        this.addLog(error.message, 'danger');
        this.notify(error.message, 'danger');
      } finally {
        this.busy.users = false;
      }
    },

    async deleteSymbol(id) {
      if (!window.confirm('Delete this symbol?')) return;

      try {
        const saved = await this.api(`${API.adminSymbols}/${id}`, { method: 'DELETE' });
        this.addLog(`Deleted symbol ${saved.providerSymbol}`, 'secondary');
        this.notify(`Deleted ${saved.providerSymbol}`, 'secondary');
        await this.loadAdminSymbols(this.adminSymbols.page);
      } catch (error) {
        this.addLog(error.message, 'danger');
        this.notify(error.message, 'danger');
      }
    },

    async deleteClient(id) {
      if (!window.confirm('Delete this client?')) return;

      try {
        const saved = await this.api(`${API.adminUsers}/${id}`, { method: 'DELETE' });
        this.addLog(`Deleted user ${saved.email}`, 'secondary');
        this.notify(`Deleted ${saved.email}`, 'secondary');
        await this.loadAdminUsers(this.adminUsers.page);
      } catch (error) {
        this.addLog(error.message, 'danger');
        this.notify(error.message, 'danger');
      }
    },

    async disableClientSocket(id) {
      try {
        const response = await this.api(`${API.adminUsers}/${id}/disable-socket`, {
          method: 'PUT',
        });
        this.addLog(`Disconnected ${response.disconnected} socket(s) for user ${id}`, 'secondary');
        this.notify(`Disconnected ${response.disconnected} socket(s)`, 'secondary');
      } catch (error) {
        this.addLog(error.message, 'danger');
        this.notify(error.message, 'danger');
      }
    },

    async subscribe(symbol) {
      if (!this.socket) {
        this.notify('Socket is not connected', 'danger');
        return;
      }

      if (this.isSubscribed(symbol.providerSymbol)) {
        return;
      }

      this.socket.emit('SYMBOL:SUBSCRIBE', {
        providerSymbol: symbol.providerSymbol,
      });

      this.subscribedSymbols.unshift(symbol.providerSymbol);
      this.subscriptionMap[symbol.providerSymbol] = { ...symbol };
      this.addLog(`Subscribed to ${symbol.providerSymbol}`, 'success');
      this.notify(`Subscribed to ${symbol.providerSymbol}`, 'success');
    },

    async unsubscribe(providerSymbol) {
      if (!this.socket) {
        this.notify('Socket is not connected', 'danger');
        return;
      }

      if (!this.isSubscribed(providerSymbol)) {
        return;
      }

      this.socket.emit('SYMBOL:UNSUBSCRIBE', { providerSymbol });
      this.subscribedSymbols = this.subscribedSymbols.filter((item) => item !== providerSymbol);
      delete this.subscriptionMap[providerSymbol];
      this.addLog(`Unsubscribed from ${providerSymbol}`, 'secondary');
      this.notify(`Unsubscribed from ${providerSymbol}`, 'secondary');
    },

    async bootstrap() {
      try {
        await this.loadProfile({ silent: true });
        this.addLog(`Loaded profile for ${this.user.email}`, 'success');
      } catch (_error) {
        this.addLog('Waiting for login', 'secondary');
      }
    },
  },
}).mount('#app');
